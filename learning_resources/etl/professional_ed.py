"""Professional Education ETL"""

import logging
from datetime import UTC, datetime
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from django.conf import settings

from learning_resources.constants import (
    CertificationType,
    LearningResourceFormat,
    OfferedBy,
    PlatformType,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import clean_data, transform_topics
from main.utils import now_in_utc

log = logging.getLogger(__name__)

BASE_URL = "https://professional.mit.edu/"
OFFERED_BY = {"code": OfferedBy.mitpe.name}
UNIQUE_FIELD = "url"


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
    topic_data = resource_data["relationships"]["field_course_topics"]
    topic_url = topic_data["links"].get("related", {}).get("href")
    if topic_data["data"] and topic_url:
        topic_data = _fetch_data(topic_url)
        return transform_topics(
            [{"name": topic["attributes"]["name"]} for topic in topic_data]
        )
    return []


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
        img_url_2 = field_image["links"]["related"]["href"]
        img_src_metadata = get_related_object(img_url_2)
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


def parse_format(format_str: str) -> list[str]:
    """
    Convert  a string to a list of resource learning formats

    Args:
        format_str: string representing the resource format

    Returns:
        list of str: list of resource formats
    """
    format_str = format_str.strip().lower()
    formats = []
    if "virtual" in format_str or "online" in format_str:
        formats.append(LearningResourceFormat.online.name)
    if "campus" in format_str:
        formats.append(LearningResourceFormat.in_person.name)
    if not formats:
        log.warning("Unknown format: %s, defaulting to online", format_str)
        formats.append(LearningResourceFormat.online.name)
    return formats


def parse_resource_url(resource_data: dict) -> str:
    """
    Return the url for the resource

    Args:
        resource_data: course or program data

    Returns:
        str: url for the resource
    """
    return urljoin(BASE_URL, resource_data["attributes"]["path"]["alias"])


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
        price = resource_data["attributes"]["field_course_fee"]
        now = now_in_utc()
        if (start_date and start_date >= now) or (
            enrollment_end_date and enrollment_end_date >= now
        ):
            runs.append(
                {
                    "run_id": f'{resource_data["id"]}_{resource_date.get("value")}',
                    "title": resource_data["attributes"]["title"],
                    "start_date": start_date,
                    "end_date": end_date,
                    "enrollment_end": enrollment_end_date,
                    "published": True,
                    "prices": [price] if price else [],
                    "url": parse_resource_url(resource_data),
                    "instructors": parse_instructors(resource_data),
                }
            )
    return runs


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
    if len(runs) > 0:
        return {
            "readable_id": resource_data["id"],
            "offered_by": OFFERED_BY,
            "platform": PlatformType.mitpe.name,
            "etl_source": ETLSource.mitpe.name,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "title": resource_data["attributes"]["title"],
            "url": parse_resource_url(resource_data),
            "image": parse_image(resource_data),
            "description": clean_data(
                resource_data["attributes"]["field_featured_course_summary"]
            ),
            "full_description": clean_data(
                resource_data["attributes"]["body"]["processed"]
            ),
            "course": {
                "course_numbers": [],
            },
            "learning_format": parse_format(
                resource_data["attributes"]["field_course_location"]
            ),
            "published": not resource_data["attributes"][
                "field_do_not_show_in_catalog"
            ],
            "topics": parse_topics(resource_data),
            "runs": runs,
            "unique_field": UNIQUE_FIELD,
        }
    return None


def transform_program(resource_data: dict) -> dict:
    """
    Transform raw resource data into a format suitable for the Program model

    Args:
        resource_data(dict): raw program data

    Returns:
        dict: transformed program data
    """
    return {
        "readable_id": resource_data["id"],
        "offered_by": OFFERED_BY,
        "platform": PlatformType.mitpe.name,
        "etl_source": ETLSource.mitpe.name,
        "professional": True,
        "certification": True,
        "certification_type": CertificationType.professional.name,
        "title": resource_data["attributes"]["title"],
        "url": parse_resource_url(resource_data),
        "image": parse_image(resource_data),
        "description": clean_data(
            resource_data["attributes"]["field_featured_course_summary"]
        ),
        "full_description": clean_data(
            resource_data["attributes"]["body"]["processed"]
        ),
        "learning_format": parse_format(
            resource_data["attributes"]["field_course_location"]
        ),
        "published": not resource_data["attributes"]["field_do_not_show_in_catalog"],
        "topics": parse_topics(resource_data),
        "runs": [
            {
                "run_id": parse_resource_url(resource_data),
                "instructors": parse_instructors(resource_data),
            }
        ],
        "course_ids": [
            course["id"]
            for course in resource_data["relationships"]["field_program_courses"][
                "data"
            ]
        ],
    }


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
            course_dict[course_id]
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
        program_course_data = resource["relationships"]["field_program_courses"]["data"]
        if program_course_data:
            programs.append(transform_program(resource))
        else:
            course = transform_course(resource)
            if course:
                courses.append(course)
    transform_program_courses(programs, courses)
    return courses, programs
