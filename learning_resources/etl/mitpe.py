"""Professional Education ETL"""

import copy
import html
import json
import logging
from datetime import UTC, datetime
from hashlib import md5
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from django.conf import settings
from django.utils.html import strip_tags

from learning_resources.constants import (
    CertificationType,
    LearningResourceFormat,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import transform_format, transform_topics
from main.utils import clean_data, now_in_utc

log = logging.getLogger(__name__)

BASE_URL = "https://professional.mit.edu/"
OFFERED_BY = {"code": OfferedBy.mitpe.name}
UNIQUE_FIELD = "url"

LOCATION_TAGS_DICT = {
    11: "On Campus",
    12: "Online",
    50: "Blended",
    53: "Live Virtual",
    105: "In Person",
}

# 14: open, 15: closed, 17: waitlisted
STATUS_DICT = {14: True, 15: False, 17: True}


def _fetch_data(url, params=None) -> list[dict]:
    """
    Fetch data from the Professional Education API

    Args:
        url(str): The url to fetch data from
        params(dict): The query parameters to include in the request

    Yields:
        list[dict]: A list of course or program data
    """
    if not params:
        params = {}
    while url:
        response = requests.get(
            url, params=params, timeout=settings.REQUESTS_TIMEOUT
        ).json()
        results = response["data"]

        yield from results
        url = response.get("links", {}).get("next", {}).get("href")


def get_related_object(url: str) -> dict:
    """
    Get the related object data for a resource

    Args:
        url(str): The url to fetch data from

    Yields:
        dict: JSON data representing a related object

    """
    response = requests.get(url, timeout=settings.REQUESTS_TIMEOUT).json()
    return response["data"]


def extract() -> list[dict]:
    """
    Load the Professional Education data from an external API

    Returns:
        list[dict]: list of raw course or program data
    """
    if settings.PROFESSIONAL_EDUCATION_API_URL:
        return list(_fetch_data(settings.PROFESSIONAL_EDUCATION_API_URL))
    else:
        log.warning("Missing required setting PROFESSIONAL_EDUCATION_API_URL")

    return []


def parse_topics(resource_data: dict) -> list[dict]:
    """
    Get a list containing {"name": <topic>} dict objects

    Args:
        resource_data: course or program data

    Returns:
        list of dict: list containing topic dicts with a name attribute
    """
    topic_names = []
    subtopic_names = []
    topic_relationships = resource_data["relationships"]["field_course_topics"]
    topics_url = topic_relationships["links"].get("related", {}).get("href")
    if topic_relationships["data"] and topics_url:
        topic_details = _fetch_data(topics_url)
        topic_names = [
            ":".join(
                [
                    topic_name.strip()
                    for topic_name in topic["attributes"]["name"].split(":")
                ]
            )
            for topic in topic_details
        ]
    subtopic_relationships = resource_data["relationships"]["field_subtopic"]
    subtopics_url = subtopic_relationships["links"].get("related", {}).get("href")
    if subtopic_relationships["data"] and subtopics_url:
        subtopic_details = _fetch_data(subtopics_url)
        subtopic_names = [
            ":".join(
                [
                    subtopic_name.strip()
                    for subtopic_name in strip_tags(
                        html.unescape(
                            subtopic["attributes"]["description"]["processed"]
                        )
                    ).split(":")
                ]
            )
            for subtopic in subtopic_details
        ]
    return transform_topics(
        [{"name": topic_name} for topic_name in (topic_names + subtopic_names)]
    )


def parse_instructors(resource_data: dict) -> list[dict]:
    """
    Get a list of instructors for a resource
    """
    instructors = []
    for attribute in ["field_lead_instructors", "field_instructors"]:
        instructors_data = resource_data["relationships"][attribute]
        instructors_url = instructors_data["links"].get("related", {}).get("href")
        if instructors_data["data"] and instructors_url:
            instructor_data = _fetch_data(instructors_url)
            instructors.extend(
                [
                    {
                        "full_name": instructor["attributes"]["title"],
                        "last_name": instructor["attributes"]["field_last_name"],
                        "first_name": instructor["attributes"]["field_first_name"],
                    }
                    for instructor in instructor_data
                ]
            )
    return instructors


def parse_image(document: dict) -> dict or None:
    """
    Create a dict object representing the resource image

    Args:
        document: course or program data

    Returns:
        dict: json representation of the image if it exists
    """
    img_url = (
        document["relationships"]
        .get("field_header_image", {})
        .get("links", {})
        .get("related", {})
        .get("href")
    )
    img_metadata = get_related_object(img_url)
    if img_metadata:
        field_image = img_metadata["relationships"]["field_media_image"]
        img_data_url = field_image["links"]["related"]["href"]
        img_src_metadata = get_related_object(img_data_url)
        if img_src_metadata:
            img_path = img_src_metadata["attributes"]["uri"]["url"]
            img_src = urljoin(BASE_URL, img_path)
            return {
                "alt": field_image.get("data", {}).get("meta", {}).get("alt"),
                "description": field_image.get("data", {}).get("meta", {}).get("title"),
                "url": img_src,
            }
    return None


def parse_date(date_str: str) -> datetime or None:
    """
    Get a datetime value from a string

    Args:
        date_str: string representing a date

    Returns:
        datetime: start or end date
    """
    if date_str:
        return (
            datetime.strptime(date_str, "%Y-%m-%d")
            .replace(tzinfo=ZoneInfo("US/Eastern"))
            .astimezone(UTC)
        )
    return None


def parse_format(location_tag: dict) -> list[str]:
    """
    Convert  a string to a list of resource learning formats

    Args:
        location_tag: dict representing the resource lcoation tag

    Returns:
        list of str: list of resource formats
    """
    location_tag_id = (
        location_tag.get("data", {}).get("meta", {}).get("drupal_internal__target_id")
    )
    if location_tag_id:
        return transform_format(LOCATION_TAGS_DICT.get(location_tag_id))
    else:
        return [LearningResourceFormat.online.name]


def parse_resource_url(resource_data: dict) -> str:
    """
    Return the url for the resource

    Args:
        resource_data: course or program data

    Returns:
        str: url for the resource
    """
    return urljoin(BASE_URL, resource_data["attributes"]["path"]["alias"])


def parse_description(resource_data: dict) -> str:
    """
    Return the description for the resource.  Use summary field if not blank.

    Args:
        resource_data: course or program data

    Returns:
        str: description for the resource
    """
    summary = resource_data["attributes"]["field_featured_course_summary"]
    if summary:
        return clean_data(summary)
    return clean_data(resource_data["attributes"]["body"]["processed"])


def parse_resource_type(resource_data: dict) -> str:
    """
    Return the type of the resource based on certificate data

    Args:
        resource_data: course or program data

    Returns:
        str: type of the resource (course or program)
    """
    course_certificate_id = 104
    certificate_ids = [
        cert["meta"]["drupal_internal__target_id"]
        for cert in resource_data["relationships"]["field_course_certificate"]["data"]
    ]
    if course_certificate_id in certificate_ids:
        return LearningResourceType.course.name
    return LearningResourceType.program.name


def _transform_runs(resource_data: dict) -> list[dict]:
    """
    Transform course/program runs into our normalized data structure

    Args:
        resource_data (dict): course/program data

    Returns:
        list[dict]: normalized course/program run data
    """
    runs = []
    resource_dates = resource_data["attributes"]["field_course_dates"]
    for resource_date in resource_dates:
        start_date = parse_date(resource_date.get("value"))
        end_date = parse_date(resource_date.get("end_value"))
        enrollment_end_date = parse_date(
            resource_data["attributes"]["field_registration_deadline"]
        )
        dates_hash = md5(json.dumps(resource_dates).encode("utf-8")).hexdigest()  # noqa: S324
        price = resource_data["attributes"]["field_course_fee"]
        now = now_in_utc()
        # Unpublish runs w/past enrollment end date or resource end date
        published = not (
            (enrollment_end_date and enrollment_end_date < now)
            or (end_date and end_date < now)
        )
        if published:
            runs.append(
                {
                    "run_id": f'{resource_data["id"]}_{dates_hash}',
                    "title": resource_data["attributes"]["title"],
                    "start_date": start_date,
                    "end_date": end_date,
                    "enrollment_end": enrollment_end_date,
                    "published": published,
                    "prices": [price] if price else [],
                    "url": parse_resource_url(resource_data),
                    "instructors": parse_instructors(resource_data),
                }
            )
    return runs


def parse_published(resource_data: dict, runs: list[dict]) -> bool:
    """
    Return the published status of the resource

    Args:
        resource_data: course or program data
        runs: list of course or program runs

    Returns:
        bool: published status of the resource
    """
    return (
        STATUS_DICT[
            resource_data["relationships"]["field_course_status"]["data"]["meta"][
                "drupal_internal__target_id"
            ]
        ]
        and not resource_data["attributes"]["field_do_not_show_in_catalog"]
        and len([run for run in runs if run["published"] is True]) > 0
    )


def transform_course(resource_data: dict) -> dict or None:
    """
    Transform raw resource data into a format suitable for
    learning resources of type course

    Args:
        resource_data(dict): raw course data

    Returns:
        dict: transformed course data if it has any viable runs
    """
    runs = _transform_runs(resource_data)
    if runs:
        return {
            "readable_id": resource_data["id"],
            "offered_by": copy.deepcopy(OFFERED_BY),
            "platform": PlatformType.mitpe.name,
            "etl_source": ETLSource.mitpe.name,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "title": resource_data["attributes"]["title"],
            "url": parse_resource_url(resource_data),
            "image": parse_image(resource_data),
            "description": parse_description(resource_data),
            "full_description": clean_data(
                resource_data["attributes"]["body"]["processed"]
            ),
            "course": {
                "course_numbers": [],
            },
            "learning_format": parse_format(
                resource_data["relationships"]["field_location_tag"]
            ),
            "published": parse_published(resource_data, runs),
            "topics": parse_topics(resource_data),
            "runs": runs,
            "unique_field": UNIQUE_FIELD,
        }
    return None


def transform_program(resource_data: dict) -> dict or None:
    """
    Transform raw resource data into a format suitable for the Program model

    Args:
        resource_data(dict): raw program data

    Returns:
        dict: transformed program data
    """
    runs = _transform_runs(resource_data)
    if runs:
        return {
            "readable_id": resource_data["id"],
            "offered_by": copy.deepcopy(OFFERED_BY),
            "platform": PlatformType.mitpe.name,
            "etl_source": ETLSource.mitpe.name,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "title": resource_data["attributes"]["title"],
            "url": parse_resource_url(resource_data),
            "image": parse_image(resource_data),
            "description": parse_description(resource_data),
            "full_description": clean_data(
                resource_data["attributes"]["body"]["processed"]
            ),
            "learning_format": parse_format(
                resource_data["relationships"]["field_location_tag"]
            ),
            "published": parse_published(resource_data, runs),
            "topics": parse_topics(resource_data),
            "course_ids": [
                course["id"]
                for course in resource_data["relationships"]["field_program_courses"][
                    "data"
                ]
            ],
            "runs": runs,
            "unique_field": UNIQUE_FIELD,
        }
    return None


def transform_program_courses(programs: list[dict], courses_data: list[dict]):
    """
    Transform the courses for a program, using the transformed course data

    Args:
        programs(list[dict]): list of program data
        courses_data(list[dict]): list of course data
    """
    course_dict = {course["readable_id"]: course for course in courses_data}
    for program in programs:
        course_ids = program.pop("course_ids", [])
        program["courses"] = [
            copy.deepcopy(course_dict[course_id])
            for course_id in course_ids
            if course_id in course_dict
        ]


def transform(data: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Transform the Professional Education data into courses and programs

    Args:
        data(dict): raw course and program data

    Returns:
        tuple[list[dict], list[dict]]: tuple containing lists of course and program data
    """
    programs = []
    courses = []
    for resource in data:
        if parse_resource_type(resource) == LearningResourceType.program.name:
            program = transform_program(resource)
            if program:
                programs.append(program)
        else:
            course = transform_course(resource)
            if course:
                courses.append(course)
    transform_program_courses(programs, courses)
    return courses, programs
