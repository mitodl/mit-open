"""Professional Education ETL"""

import copy
import html
import logging
import re
from datetime import UTC, datetime
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from django.conf import settings

from learning_resources.constants import (
    Availability,
    CertificationType,
    Format,
    LearningResourceType,
    OfferedBy,
    Pace,
    PlatformType,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import transform_delivery, transform_topics
from main.utils import clean_data

log = logging.getLogger(__name__)

BASE_URL = "https://professional.mit.edu/"
OFFERED_BY = {"code": OfferedBy.mitpe.name}


def _fetch_data(url) -> list[dict]:
    """
    Fetch data from the Professional Education API

    Args:
        url(str): The url to fetch data from

    Yields:
        list[dict]: A list of course or program data
    """
    params = {"page": 0}
    has_results = True
    while has_results:
        results = requests.get(
            url, params=params, timeout=settings.REQUESTS_TIMEOUT
        ).json()
        has_results = len(results) > 0
        yield from results
        params["page"] += 1


def extract() -> list[dict]:
    """
    Load the Professional Education data from an external API

    Returns:
        list[dict]: list of raw course or program data
    """
    required_settings = [
        "MITPE_BASE_API_URL",
        "MITPE_API_ENABLED",
    ]
    for setting in required_settings:
        if not getattr(settings, setting):
            log.warning("Missing required setting %s", setting)
            return []
    return list(_fetch_data(urljoin(settings.MITPE_BASE_API_URL, "/feeds/courses/")))


def parse_topics(resource_data: dict) -> list[dict]:
    """
    Get a list containing {"name": <topic>} dict objects

    Args:
        resource_data: course or program data

    Returns:
        list of dict: list containing topic dicts with a name attribute
    """
    extracted_topics = resource_data["topics"]
    if not extracted_topics:
        return []
    topics = [
        ":".join(topic.split(":")[1:]).strip()
        for topic in extracted_topics.split("|")
        if topic
    ]
    return transform_topics(
        [{"name": html.unescape(topic_name)} for topic_name in topics if topic_name],
        OfferedBy.mitpe.name,
    )


def parse_instructors(resource_data: dict) -> list[dict]:
    """
    Get a list of instructors for a resource
    """
    instructors = []
    for attribute in ["lead_instructors", "instructors"]:
        instructors.extend(
            [
                {"full_name": html.unescape(instructor)}
                for instructor in resource_data[attribute].split("|")
            ]
        )
    return instructors


def parse_image(resource_data: dict) -> dict or None:
    """
    Create a dict object representing the resource image

    Args:
        resource_data: course or program data

    Returns:
        dict: json representation of the image if it exists
    """
    img_src = resource_data["image__src"]
    if img_src:
        return {
            "alt": resource_data["image__alt"],
            "url": urljoin(BASE_URL, img_src),
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


def parse_resource_url(resource_data: dict) -> str:
    """
    Return the url for the resource

    Args:
        resource_data: course or program data

    Returns:
        str: url for the resource
    """
    return urljoin(BASE_URL, resource_data["url"])


def clean_title(title: str) -> str:
    """
    Clean the title of the resource

    Args:
        title: title of the resource

    Returns:
        str: cleaned title
    """
    return html.unescape(title.strip())


def parse_description(resource_data: dict) -> str:
    """
    Return the description for the resource.  Use summary field if not blank.

    Args:
        resource_data: course or program data

    Returns:
        str: description for the resource
    """
    return clean_data(resource_data["description"])


def parse_resource_type(resource_data: dict) -> str:
    """
    Return the type of the resource based on certificate data

    Args:
        resource_data: course or program data

    Returns:
        str: type of the resource (course or program)
    """
    if resource_data["resource_type"]:
        return resource_data["resource_type"]
    else:
        # Determine based on certificate data
        if "Certificate of Completion" in resource_data["course_certificate"].split(
            "|"
        ):
            return LearningResourceType.course.name
        return LearningResourceType.program.name


def parse_location(resource_data: dict) -> str:
    """
    Return the location of the resource if relevant

    Args:
        resource_data: course or program data

    Returns:
        str: location of the resource
    """
    if resource_data["learning_format"] in ["In Person", "On Campus", "Blended"]:
        return resource_data["location"]
    return None


def _transform_runs(resource_data: dict) -> list[dict]:
    """
    Transform course/program runs into our normalized data structure

    Args:
        resource_data (dict): course/program data

    Returns:
        list[dict]: normalized course/program run data
    """
    runs_data = zip(
        resource_data["run__readable_id"].split("|"),
        resource_data["start_date"].split("|"),
        resource_data["end_date"].split("|"),
        resource_data["enrollment_end_date"].split("|"),
    )
    return [
        {
            "run_id": run_data[0],
            "title": clean_title(resource_data["title"]),
            "description": parse_description(resource_data),
            "start_date": parse_date(run_data[1]),
            "end_date": parse_date(run_data[2]),
            "enrollment_end": parse_date(run_data[3]),
            "published": True,
            "prices": [re.sub(r"[^0-9\\.]", "", resource_data["price"])]
            if resource_data["price"]
            else [],
            "url": parse_resource_url(resource_data),
            "instructors": parse_instructors(resource_data),
            "format": [Format.asynchronous.name],
            "pace": [Pace.instructor_paced.name],
            "availability": Availability.dated.name,
            "delivery": transform_delivery(resource_data["learning_format"]),
            "location": parse_location(resource_data),
        }
        for run_data in runs_data
    ]


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
            "readable_id": resource_data["uuid"],
            "offered_by": copy.deepcopy(OFFERED_BY),
            "platform": PlatformType.mitpe.name,
            "etl_source": ETLSource.mitpe.name,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "title": clean_title(resource_data["title"]),
            "url": parse_resource_url(resource_data),
            "image": parse_image(resource_data),
            "description": parse_description(resource_data),
            "course": {
                "course_numbers": [],
            },
            "delivery": transform_delivery(resource_data["learning_format"]),
            "published": True,
            "topics": parse_topics(resource_data),
            "runs": runs,
            "format": [Format.asynchronous.name],
            "pace": [Pace.instructor_paced.name],
            "availability": Availability.dated.name,
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
            "readable_id": resource_data["uuid"],
            "offered_by": copy.deepcopy(OFFERED_BY),
            "platform": PlatformType.mitpe.name,
            "etl_source": ETLSource.mitpe.name,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "title": clean_title(resource_data["title"]),
            "url": parse_resource_url(resource_data),
            "image": parse_image(resource_data),
            "description": parse_description(resource_data),
            "course_titles": [
                course_title
                for course_title in resource_data["courses"].split("|")
                if course_title
            ],
            "delivery": transform_delivery(resource_data["learning_format"]),
            "published": True,
            "topics": parse_topics(resource_data),
            "runs": runs,
            "format": [Format.asynchronous.name],
            "pace": [Pace.instructor_paced.name],
            "availability": Availability.dated.name,
        }
    return None


def transform_program_courses(programs: list[dict], courses_data: list[dict]):
    """
    Transform the courses for a program, using the transformed course data

    Args:
        programs(list[dict]): list of program data
        courses_data(list[dict]): list of course data
    """
    course_dict = {course["title"]: course for course in courses_data}
    for program in programs:
        course_titles = [
            clean_title(title) for title in program.pop("course_titles", [])
        ]
        program["courses"] = [
            copy.deepcopy(course_dict[course_title])
            for course_title in course_titles
            if course_title in course_dict
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
