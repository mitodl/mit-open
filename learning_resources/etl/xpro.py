"""xPro learning_resources ETL"""

import copy
import logging
from datetime import UTC

import requests
from dateutil.parser import parse
from django.conf import settings

from learning_resources.constants import LearningResourceType, OfferedBy, PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import (
    generate_course_numbers_json,
    transform_format,
    transform_topics,
)

log = logging.getLogger(__name__)

OFFERED_BY = {"code": OfferedBy.xpro.name}

# This needs to be kept up to date with valid xpro platforms
XPRO_PLATFORM_TRANSFORM = {
    "Emeritus": PlatformType.emeritus.name,
    "Global Alumni": PlatformType.globalalumni.name,
    "Simplilearn": PlatformType.simplilearn.name,
    "Susskind": PlatformType.susskind.name,
    "WHU": PlatformType.whu.name,
    "xPRO": PlatformType.xpro.name,
}


def _parse_datetime(value):
    """
    Parses an xPro datetime string

    Args:
        value(str): the datetime in string format

    Returns:
        datetime: the parsed datetime
    """  # noqa: D401
    return parse(value).replace(tzinfo=UTC) if value else None


def extract_programs():
    """Loads the xPro catalog data"""  # noqa: D401
    if settings.XPRO_CATALOG_API_URL:
        return requests.get(settings.XPRO_CATALOG_API_URL, timeout=20).json()
    log.warning("Missing required setting XPRO_CATALOG_API_URL")
    return []


def extract_courses():
    """Loads the xPro catalog data"""  # noqa: D401
    if settings.XPRO_COURSES_API_URL:
        return requests.get(settings.XPRO_COURSES_API_URL, timeout=20).json()
    log.warning("Missing required setting XPRO_COURSES_API_URL")
    return []


def _transform_run(course_run):
    """
    Transforms a course run into our normalized data structure

    Args:
        course_run (dict): course run data

    Returns:
        dict: normalized course run data
    """  # noqa: D401
    return {
        "run_id": course_run["courseware_id"],
        "title": course_run["title"],
        "start_date": _parse_datetime(
            course_run["start_date"] or course_run["enrollment_start"]
        ),
        "end_date": _parse_datetime(course_run["end_date"]),
        "enrollment_start": _parse_datetime(course_run["enrollment_start"]),
        "enrollment_end": _parse_datetime(course_run["enrollment_end"]),
        "published": bool(course_run["current_price"]),
        "prices": (
            [course_run["current_price"]]
            if course_run.get("current_price", None)
            else []
        ),
        "instructors": [
            {"full_name": instructor["name"]}
            for instructor in course_run["instructors"]
        ],
    }


def _transform_learning_resource_course(course):
    """
    Transforms a course into our normalized data structure

    Args:
        course (dict): course data

    Returns:
        dict: normalized learning resource data
    """  # noqa: D401
    return {
        "readable_id": course["readable_id"],
        "platform": XPRO_PLATFORM_TRANSFORM.get(course["platform"], None),
        "etl_source": ETLSource.xpro.name,
        "title": course["title"],
        "image": {"url": course["thumbnail_url"]},
        "offered_by": copy.deepcopy(OFFERED_BY),
        "professional": True,
        "description": course["description"],
        "url": course.get("url"),
        "published": any(
            course_run.get("current_price", None) for course_run in course["courseruns"]
        ),
        "topics": transform_topics(course.get("topics", [])),
        "runs": [_transform_run(course_run) for course_run in course["courseruns"]],
        "resource_type": LearningResourceType.course.name,
        "format": transform_format(course.get("format")),
        "course": {
            "course_numbers": generate_course_numbers_json(
                course["readable_id"], is_ocw=False
            ),
        },
    }


def transform_courses(courses):
    """
    Transforms a list of courses into our normalized data structure

    Args:
        courses (list of dict): courses data
        xpro_platform_map (dict): dict of xpro platform names to platform values

    Returns:
        list of dict: normalized courses data
    """  # noqa: D401
    return [_transform_learning_resource_course(course) for course in courses]


def transform_programs(programs):
    """Transform the xPro catalog data"""
    # normalize the xPro data into the learning_resources/models.py data structures
    return [
        {
            "readable_id": program["readable_id"],
            "etl_source": ETLSource.xpro.name,
            "title": program["title"],
            "image": {"url": program["thumbnail_url"]},
            "description": program["description"],
            "offered_by": copy.deepcopy(OFFERED_BY),
            "professional": True,
            "published": bool(
                program["current_price"]
            ),  # a program is only considered published if it has a product/price
            "url": program["url"],
            "topics": transform_topics(program.get("topics", [])),
            "platform": XPRO_PLATFORM_TRANSFORM.get(program["platform"], None),
            "resource_type": LearningResourceType.program.name,
            "format": transform_format(program.get("format")),
            "runs": [
                {
                    "prices": (
                        [program["current_price"]]
                        if program.get("current_price", None)
                        else []
                    ),
                    "title": program["title"],
                    "run_id": program["readable_id"],
                    "enrollment_start": _parse_datetime(program["enrollment_start"]),
                    "start_date": _parse_datetime(
                        program["start_date"] or program["enrollment_start"]
                    ),
                    "end_date": _parse_datetime(program["end_date"]),
                    "description": program["description"],
                    "instructors": [
                        {"full_name": instructor["name"]}
                        for instructor in program.get("instructors", [])
                    ],
                }
            ],
            "courses": transform_courses(program["courses"]),
        }
        for program in programs
    ]
