"""Prolearn ETL"""

import logging
import re
from datetime import UTC, datetime
from decimal import Decimal
from urllib.parse import urljoin, urlparse

import requests
from django.conf import settings

from learning_resources.constants import Availability, CertificationType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import transform_delivery, transform_topics
from learning_resources.models import LearningResourceOfferor, LearningResourcePlatform
from main.utils import clean_data, now_in_utc

log = logging.getLogger(__name__)

"""
 Dict of Prolearn "departments" (ie offerors) that should be imported.
 Currently each department corresponds to an "offered by" value,
 prefixed with "MIT "
"""


PROLEARN_BASE_URL = "https://prolearn.mit.edu"

# List of query fields for prolearn, deduced from its website api calls
PROLEARN_QUERY_FIELDS = "title\nnid\nurl\ncertificate_name\ncourse_application_url\ncourse_link\nfield_course_or_program\nstart_value\nend_value\ndepartment\ndepartment_url\nbody\nbody_override\nfield_time_commitment\nfield_duration\nfeatured_image_url\nfield_featured_video\nfield_non_degree_credits\nfield_price\nfield_related_courses_programs\nrelated_courses_programs_title\nfield_time_commitment\nucc_hot_topic\nucc_name\nucc_tid\napplication_process\napplication_process_override\nformat_name\nimage_override_url\nvideo_override_url\nfield_new_course_program\nfield_tooltip"  # noqa: E501

SEE_EXCLUSION = (
    '{operator: "<>", name: "department", value: "MIT Sloan Executive Education"}'
)

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
                        %s
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


def parse_offered_by(document: dict) -> LearningResourceOfferor:
    """
    Get a properly formatted offered_by name for a course/program

    Args:
        document: course or program data

    Returns:
        LearningResourceOfferor: offeror or None
    """
    return LearningResourceOfferor.objects.filter(
        name=document["department"].strip()
    ).first()


def parse_platform(document: dict) -> str or None:
    """
    Get the platform code for a Prolearn course/program.

    Args:
        document: course or program data

    Returns:
        str or None: platform.code
    """
    department = document["department"].strip()
    platform = LearningResourcePlatform.objects.filter(
        name__in=[department, department.lstrip("MIT").strip()]
    ).first()
    return platform.code if platform else None


def parse_date(num) -> datetime:
    """
    Get a datetime value from an list containing one integer

    Args:
        list of int: list containing one integer

    Returns:
        datetime: start or end date
    """
    if num:
        return datetime.fromtimestamp(num, tz=UTC)
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


def parse_topic(document: dict, offeror_code: str) -> list[dict]:
    """
    Get a list containing one {"name": <topic>} dict object

    Args:
        document: course or program data
        offeror_code: the parsed offeror code

    Returns:
        list of dict: list containing one topic dict with a name attribute
    """
    topic = document.get("ucc_name")
    return transform_topics([{"name": topic}], offeror_code) if topic else []


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


def update_format(unique_resource: dict, resource_format: list[str]):
    """
    Merge the formats for multiple instances of the same resource.

    Args:
        unique_resource: previously transformed resource w/a unique url
        resource_data: another resource with the same url

    """
    unique_resource["learning_format"] = sorted(
        set(unique_resource["learning_format"] + resource_format)
    )
    unique_resource["delivery"] = unique_resource["learning_format"]


def extract_data(course_or_program: str) -> list[dict]:
    """
    Queries the prolearn api url for either courses or programs from a department, and returns the results

    Args:
        course_or_program (str): "course" or "program"

    Returns:
        list of dict: courses or programs
    """  # noqa: D401, E501
    if settings.PROLEARN_CATALOG_API_URL:
        sloan_filter = SEE_EXCLUSION if settings.SEE_API_ENABLED else ""
        response = requests.post(
            settings.PROLEARN_CATALOG_API_URL,
            json={
                "query": PROLEARN_QUERY
                % (course_or_program, sloan_filter, PROLEARN_QUERY_FIELDS)
            },
            timeout=30,
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
    unique_programs = {}
    for program in programs:
        offered_by = parse_offered_by(program)
        platform = parse_platform(program)
        runs = _transform_runs(program)
        if platform and runs:
            transformed_program = {
                "readable_id": f'prolearn-{platform}-{program["nid"]}',
                "title": program["title"],
                "description": clean_data(program["body"]),
                "offered_by": {"name": offered_by.name} if offered_by else None,
                "platform": platform,
                "etl_source": ETLSource.prolearn.name,
                "url": parse_url(program),
                "image": parse_image(program),
                "professional": True,
                "certification": True,
                "certification_type": CertificationType.professional.name,
                "learning_format": transform_delivery(program["format_name"]),
                "runs": runs,
                "topics": parse_topic(program, offered_by.code) if offered_by else None,
                "courses": [
                    {
                        "readable_id": course_id,
                        "offered_by": {"name": offered_by.name} if offered_by else None,
                        "platform": platform,
                        "etl_source": ETLSource.prolearn.name,
                        "certification": True,
                        "certification_type": CertificationType.professional.name,
                        "professional": True,
                        "runs": [
                            {
                                "run_id": course_id,
                            }
                        ],
                        "unique_field": UNIQUE_FIELD,
                    }
                    for course_id in sorted(program["field_related_courses_programs"])
                ],
                "unique_field": UNIQUE_FIELD,
            }
            unique_program = unique_programs.setdefault(
                transformed_program["url"], transformed_program
            )
            update_format(unique_program, transformed_program["learning_format"])
            unique_programs[transformed_program["url"]] = unique_program
    return list(unique_programs.values())


def _transform_runs(resource: dict) -> list[dict]:
    """
    Transform a course/program run into our normalized data structure

    Args:
        resource (dict): course/program data

    Returns:
        dict: normalized course/program data
    """
    runs = []
    for start_value, end_value in zip(resource["start_value"], resource["end_value"]):
        start_date = parse_date(start_value)
        if start_date and start_date >= now_in_utc():
            runs.append(
                {
                    "run_id": f'{resource["nid"]}_{start_value}',
                    "title": resource["title"],
                    "image": parse_image(resource),
                    "description": clean_data(resource["body"]),
                    "start_date": start_date,
                    "end_date": parse_date(end_value),
                    "published": True,
                    "prices": parse_price(resource),
                    "url": parse_url(resource),
                    "delivery": transform_delivery(resource["format_name"]),
                    "availability": Availability.dated.name,
                }
            )
    return runs


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
    runs = _transform_runs(course)
    if len(runs) > 0:
        return {
            "readable_id": f'prolearn-{platform}-{course["nid"]}',
            "offered_by": {"name": offered_by.name} if offered_by else None,
            "platform": platform,
            "etl_source": ETLSource.prolearn.name,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "title": course["title"],
            "url": parse_url(course),
            "image": parse_image(course),
            "description": clean_data(course["body"]),
            "course": {
                "course_numbers": [],
            },
            "learning_format": transform_delivery(course["format_name"]),
            "delivery": transform_delivery(course["format_name"]),
            "published": True,
            "topics": parse_topic(course, offered_by.code) if offered_by else None,
            "runs": runs,
            "unique_field": UNIQUE_FIELD,
            "availability": Availability.dated.name,
        }
    return None


def transform_courses(courses: list[dict]) -> list[dict]:
    """
    Transform a list of courses into our normalized data structure

    Args:
        courses (list of dict): courses data

    Returns:
        list of dict: normalized courses data
    """
    unique_courses = {}
    for course in courses:
        offered_by = parse_offered_by(course)
        platform = parse_platform(course)
        if platform:
            transformed_course = _transform_course(course, offered_by, platform)
            if transformed_course:
                unique_course = unique_courses.setdefault(
                    transformed_course["url"], transformed_course
                )
                update_format(unique_course, transformed_course["learning_format"])
                unique_courses[transformed_course["url"]] = unique_course
    return list(unique_courses.values())
