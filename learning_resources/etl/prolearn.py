"""Prolearn ETL"""

import logging
import re
from datetime import datetime
from decimal import Decimal
from urllib.parse import urljoin, urlparse

import pytz
import requests
from django.conf import settings

from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import transform_topics
from learning_resources.models import LearningResourceOfferor, LearningResourcePlatform

log = logging.getLogger(__name__)

"""
 Dict of Prolearn "departments" (ie offerors) that should be imported.
 Currently each department corresponds to an "offered by" value,
 prefixed with "MIT "
"""

PROLEARN_BASE_URL = "https://prolearn.mit.edu"

# List of query fields for prolearn, deduced from its website api calls
PROLEARN_QUERY_FIELDS = "title\nnid\nurl\ncertificate_name\ncourse_application_url\ncourse_link\nfield_course_or_program\nstart_value\nend_value\ndepartment\ndepartment_url\nbody\nbody_override\nfield_time_commitment\nfield_duration\nfeatured_image_url\nfield_featured_video\nfield_non_degree_credits\nfield_price\nfield_related_courses_programs\nrelated_courses_programs_title\nfield_time_commitment\nucc_hot_topic\nucc_name\nucc_tid\napplication_process\napplication_process_override\nformat_name\nimage_override_url\nvideo_override_url\nfield_new_course_program\nfield_tooltip"  # noqa: E501

# Performs the query made on https://prolearn.mit.edu/graphql, with a filter for program or course  # noqa: E501
PROLEARN_QUERY = """
query {
    searchAPISearch(
        index_id:\"default_solr_index\",
        range:{limit: 999, offset: 0},
        condition_group: {
            conjunction: AND,
            groups: [
                {
                    conjunction: AND,
                    conditions: [
                        {operator: \"=\", name: \"field_course_or_program\", value: \"%s\"},
                        {operator: \"<>\", name: \"department\", value: \"MIT xPRO\"}
                    ]
                }
            ]
        }
    ) {
        result_count
         documents {... on DefaultSolrIndexDoc {%s}}
    }
}
"""  # noqa: E501

UNIQUE_FIELD = "url"


def get_offered_by(document: dict) -> LearningResourceOfferor:
    """
    Get a properly formatted offered_by name for a course/program

    Args:
        document: course or program data

    Returns:
        LearningResourceOfferor: offeror or None
    """
    return LearningResourceOfferor.objects.filter(
        name=document["department"].lstrip("MIT").strip()
    ).first()


def parse_platform(offeror: LearningResourceOfferor) -> str:
    """
    Get the platform value for a Prolearn course/program.
    Assumes that offeror code == platform code for this particular source.

    Args:
        offeror: LearningResourceOfferer

    Returns:
        str: platform.code value
    """
    if offeror:
        platform = LearningResourcePlatform.objects.filter(code=offeror.code).first()
        if platform:
            return platform.code
    return None


def parse_date(num) -> datetime:
    """
    Get a datetime value from an list containing one integer

    Args:
        list of int: list containing one integer

    Returns:
        datetime: start or end date
    """
    if num:
        return datetime.fromtimestamp(num, tz=pytz.UTC)
    return None


def parse_price(document: dict) -> Decimal:
    """
    Get a Decimal value for a course/program price

    Args:
        document: course or program data

    Returns:
        Decimal: price of the course/program
    """
    price_str = (
        re.sub(r"[^\d.]", "", document["field_price"])
        if document.get("field_price") is not None
        else ""
    )
    return [round(Decimal(price_str), 2)] if price_str else []


def parse_topic(document: dict) -> list[dict]:
    """
    Get a list containing one {"name": <topic>} dict object

    Args:
        document: course or program data

    Returns:
        list of dict: list containing one topic dict with a name attribute
    """
    topic = document.get("ucc_name")
    return transform_topics([{"name": topic}]) if topic else []


def parse_image(document: dict) -> dict:
    """
    Get an image element w/full url for a course/program

    Args:
        document: course or program data

    Returns:
        dict: image element with url
    """
    url = document.get("featured_image_url")
    return {"url": urljoin(settings.PROLEARN_CATALOG_API_URL, url)} if url else None


def parse_url(document: dict) -> str:
    """
    Get a full url for a course/program.
    Order of preference: course_link, course_application_url, url

    Args:
        document: course or program data

    Returns:
        str: full url of the course or program
    """
    course_link = document.get("course_link")
    if course_link and not urlparse(course_link).path:
        # A course link without a path is not helpful
        course_link = None
    prolearn_link = document.get("url")
    if prolearn_link:
        prolearn_link = urljoin(PROLEARN_BASE_URL, prolearn_link)
    return course_link or document["course_application_url"] or prolearn_link


def extract_data(course_or_program: str) -> list[dict]:
    """
    Queries the prolearn api url for either courses or programs from a department, and returns the results

    Args:
        course_or_program (str): "course" or "program"

    Returns:
        list of dict: courses or programs
    """  # noqa: D401, E501
    if settings.PROLEARN_CATALOG_API_URL:
        response = requests.post(  # noqa: S113
            settings.PROLEARN_CATALOG_API_URL,
            json={"query": PROLEARN_QUERY % (course_or_program, PROLEARN_QUERY_FIELDS)},
        ).json()
        return response["data"]["searchAPISearch"]["documents"]
    log.warning("Missing required setting PROLEARN_CATALOG_API_URL")
    return []


def extract_programs() -> list[dict]:
    """
    Query the ProLearn catalog data for programs

    Returns:
        list of dict: programs
    """
    return extract_data("program")


def extract_courses() -> list[dict]:
    """
    Query the ProLearn catalog data for courses

    Returns:
        list of dict: courses
    """
    return extract_data("course")


def transform_programs(programs: list[dict]) -> list[dict]:
    """
    Transform the prolearn catalog data for programs into a format
    suitable for saving to the database

    Args:
        programs: list of programs as dicts

    Returns:
        list of dict: List of programs as transformed dicts
    """
    program_list = []
    for program in programs:
        offered_by = get_offered_by(program)
        platform = parse_platform(offered_by)
        if offered_by and platform:
            program_list.append(
                {
                    "readable_id": f'prolearn-{platform}-{program["nid"]}',
                    "title": program["title"],
                    "offered_by": {"name": offered_by.name},
                    "platform": platform,
                    "etl_source": ETLSource.prolearn.name,
                    "url": parse_url(program),
                    "image": parse_image(program),
                    "professional": offered_by.professional,
                    "runs": [
                        {
                            "run_id": f'{program["nid"]}_{start_value}',
                            "title": program["title"],
                            "prices": parse_price(program),
                            "start_date": parse_date(start_value),
                            "end_date": parse_date(end_value),
                        }
                        for (start_value, end_value) in zip(
                            program["start_value"], program["end_value"]
                        )
                    ],
                    "topics": parse_topic(program),
                    "courses": [
                        {
                            "readable_id": course_id,
                            "offered_by": {"name": offered_by.name},
                            "platform": platform,
                            "etl_source": ETLSource.prolearn.name,
                            "professional": offered_by.professional,
                            "runs": [
                                {
                                    "run_id": course_id,
                                }
                            ],
                            "unique_field": UNIQUE_FIELD,
                        }
                        for course_id in sorted(
                            program["field_related_courses_programs"]
                        )
                    ],
                    "unique_field": UNIQUE_FIELD,
                }
            )
    return program_list


def _transform_runs(course_run: dict) -> dict:
    """
    Transform a course run into our normalized data structure

    Args:
        course_run (dict): course run data

    Returns:
        dict: normalized course run data
    """
    return [
        {
            "run_id": f'{course_run["nid"]}_{start_value}',
            "title": course_run["title"],
            "image": parse_image(course_run),
            "description": course_run["body"],
            "start_date": parse_date(start_value),
            "end_date": parse_date(end_value),
            "published": True,
            "prices": parse_price(course_run),
            "url": parse_url(course_run),
        }
        for (start_value, end_value) in zip(
            course_run["start_value"], course_run["end_value"]
        )
    ]


def _transform_course(
    course: dict, offered_by: LearningResourceOfferor, platform: str
) -> dict:
    """
    Transforms a course into our normalized data structure

    Args:
        course (dict): course data

    Returns:
        dict: normalized course data
    """  # noqa: D401
    return {
        "readable_id": f'prolearn-{platform}-{course["nid"]}',
        "offered_by": {"name": offered_by.name},
        "platform": platform,
        "etl_source": ETLSource.prolearn.name,
        "professional": offered_by.professional,
        "title": course["title"],
        "url": parse_url(course),
        "image": parse_image(course),
        "description": course["body"],
        "course": {
            "course_numbers": [],
        },
        "published": True,
        "topics": parse_topic(course),
        "runs": _transform_runs(course),
        "unique_field": UNIQUE_FIELD,
    }


def transform_courses(courses: list[dict]) -> list[dict]:
    """
    Transform a list of courses into our normalized data structure

    Args:
        courses (list of dict): courses data

    Returns:
        list of dict: normalized courses data
    """
    for course in courses:
        offered_by = get_offered_by(course)
        platform = parse_platform(offered_by)
        if offered_by and platform:
            yield _transform_course(course, offered_by, platform)
