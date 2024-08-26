"""ETL for Sloan Executive Education data."""

import logging
from datetime import UTC
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from dateparser import parse
from django.conf import settings

from learning_resources.constants import (
    Availability,
    CertificationType,
    OfferedBy,
    PlatformType,
    RunAvailability,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import (
    transform_format,
    transform_topics,
)

log = logging.getLogger(__name__)

OFFERED_BY_CODE = OfferedBy.see.name


def _get_access_token():
    """
    Get an access token for edx

    Args:
        config (OpenEdxConfiguration): configuration for the openedx backend

    Returns:
        str: the access token
    """
    payload = {
        "grant_type": "client_credentials",
        "client_id": settings.SEE_API_CLIENT_ID,
        "client_secret": settings.SEE_API_CLIENT_SECRET,
        "token_type": "jwt",
    }
    response = requests.post(  # noqa: S113
        settings.SEE_API_ACCESS_TOKEN_URL, data=payload
    )
    response.raise_for_status()

    return response.json()["access_token"]


def parse_topics(topic):
    """
    Parse topics from a string

    Args:
        topic (str): the topic string

    Returns:
        list: the parsed topics
    """

    return (
        transform_topics([{"name": topic.split(":")[-1].strip()}], OFFERED_BY_CODE)
        if topic
        else []
    )


def parse_image(course_data):
    """
    Parse image from course data

    Args:
        course_data (dict): the course data

    Returns:
        str: the image URL
    """
    image_url = course_data.get("Image_Src")
    if image_url:
        return {
            "url": image_url,
            "alt": course_data.get("Title"),
            "description": course_data.get("Title"),
        }
    return None


def parse_datetime(value):
    """
    Parses a datetime string

    Args:
        value(str): the datetime in string format

    Returns:
        datetime: the parsed datetime
    """  # noqa: D401
    return (
        parse(value).replace(tzinfo=ZoneInfo("US/Eastern")).astimezone(UTC)
        if value
        else None
    )


def parse_availability(runs_data):
    """
    Parse availability from runs data

    Args:
        runs_data (list): the runs data

    Returns:
        str: the availability
    """
    availablity = set()
    if runs_data:
        for run in runs_data:
            if (
                run.get("Delivery", "") == "Online"
                and run.get("Format", "") == "Asynchronous (On-Demand)"
            ):
                availablity.add(Availability.anytime.name)
            else:
                availablity.add(Availability.dated.name)
    return list(availablity) or [Availability.dated.name]


def extract():
    """
    Extract Sloan Executive Education data
    """
    required_settings = [
        "SEE_API_CLIENT_ID",
        "SEE_API_CLIENT_SECRET",
        "SEE_API_ACCESS_TOKEN_URL",
        "SEE_API_URL",
        "SEE_API_ENABLED",
    ]
    for setting in required_settings:
        if not getattr(settings, setting):
            log.warning("Missing required setting %s", setting)
            return [], []

    access_token = _get_access_token()
    courses_response = requests.get(  # noqa: S113
        urljoin(settings.SEE_API_URL, "courses"),
        headers={"Authorization": f"JWT {access_token}"},
    )
    courses_response.raise_for_status()
    runs_response = requests.get(  # noqa: S113
        urljoin(settings.SEE_API_URL, "course-offerings"),
        headers={"Authorization": f"JWT {access_token}"},
    )
    runs_response.raise_for_status()

    courses_data = courses_response.json()
    runs_data = runs_response.json()

    return courses_data, runs_data


def transform_run(run_data, course_data):
    """
    Transform Sloan Executive Education run data

    Args:
        run_data (dict): the run data
        course_data (dict): the course data

    Returns:
        dict: the transformed data
    """
    faculty_names = (
        run_data["Faculty_Name"].split(",") if run_data["Faculty_Name"] else []
    )
    return {
        "run_id": run_data["CO_Title"],
        "start_date": parse_datetime(run_data["Start_Date"]),
        "end_date": parse_datetime(run_data["End_Date"]),
        "title": course_data["Title"],
        "url": course_data["URL"],
        "availability": RunAvailability.current.value,
        "published": True,
        "prices": [run_data["Price"]],
        "instructors": [{"full_name": name.strip()} for name in faculty_names],
    }


def transform_course(course_data: dict, runs_data: dict) -> dict:
    """
    Transform Sloan Executive Education course data

    Args:
        course_data (dict): the course data
        runs_data (dict): the runs data for the course

    Returns:
        dict: the transformed data
    """

    course_runs_data = [
        run for run in runs_data if run["Course_Id"] == course_data["Course_Id"]
    ]

    transformed_course = {
        "readable_id": course_data["Course_Id"],
        "title": course_data["Title"],
        "offered_by": {"code": OfferedBy.see.name},
        "platform": PlatformType.see.name,
        "etl_source": ETLSource.see.name,
        "description": course_data["Description"],
        "url": course_data["URL"],
        "image": parse_image(course_data),
        "certification": True,
        "certification_type": CertificationType.professional.name,
        "professional": True,
        "published": True,
        "learning_format": list(
            {transform_format(run["Delivery"])[0] for run in course_runs_data}
        ),
        "topics": parse_topics(course_data["Topics"]),
        "course": {
            "course_numbers": [],
        },
        "runs": [transform_run(run, course_data) for run in course_runs_data],
        "availability": parse_availability(course_runs_data),
    }

    return transformed_course if transformed_course.get("url") else None


def transform_courses(course_runs_tuple: tuple[dict, dict]) -> dict:
    """
    Transform Sloan Executive Education data

    Args:
        course_runs_tuple (tuple[list[dict],list[dict]): the courses and offerings data

    Yields:
        dict: the transformed course data
    """
    courses_data, runs_data = course_runs_tuple
    courses_runs_map = {}
    for run in runs_data:
        courses_runs_map.setdefault(run["Course_Id"], []).append(run)
    for course in courses_data:
        if courses_runs_map.get(course["Course_Id"]) is None:
            log.warning(
                "Course %s - %s has no runs", course["Course_Id"], course["Title"]
            )
            continue
        if not course["URL"]:
            log.warning(
                "Course %s - %s has no URL", course["Course_Id"], course["Title"]
            )
            continue
        yield transform_course(course, courses_runs_map[course["Course_Id"]])
