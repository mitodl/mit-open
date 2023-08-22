"""xPro course catalog ETL"""
import copy
import logging
from datetime import datetime
from dateutil.parser import parse

import pytz
import requests
from django.conf import settings

from learning_resources.constants import OfferedBy, PlatformType, LearningResourceType
from learning_resources.etl.utils import transform_topics

log = logging.getLogger(__name__)


OFFERED_BY = [{"name": OfferedBy.xpro.value}]


def _parse_datetime(value):
    """
    Parses an xPro datetime string

    Args:
        value(str): the datetime in string format

    Returns:
        datetime: the parsed datetime
    """
    return parse(value).replace(tzinfo=pytz.utc) if value else None


def extract_programs():
    """Loads the xPro catalog data"""
    if settings.XPRO_CATALOG_API_URL:
        return requests.get(settings.XPRO_CATALOG_API_URL).json()
    return []


def extract_courses():
    """Loads the xPro catalog data"""
    if settings.XPRO_COURSES_API_URL:
        return requests.get(settings.XPRO_COURSES_API_URL).json()
    return []


def _transform_run(course_run):
    """
    Transforms a course run into our normalized data structure

    Args:
        course_run (dict): course run data

    Returns:
        dict: normalized course run data
    """
    return {
        "run_id": course_run["courseware_id"],
        "title": course_run["title"],
        "start_date": _parse_datetime(course_run["start_date"]),
        "end_date": _parse_datetime(course_run["end_date"]),
        "enrollment_start": _parse_datetime(course_run["enrollment_start"]),
        "enrollment_end": _parse_datetime(course_run["enrollment_end"]),
        "offered_by": copy.deepcopy(OFFERED_BY),
        "published": bool(course_run["current_price"]),
        "prices": [course_run["current_price"]]
        if course_run.get("current_price", None)
        else [],
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
    """
    return {
        "readable_id": course["readable_id"],
        "platform": PlatformType.xpro.value,
        "title": course["title"],
        "image": {"url": course["thumbnail_url"]},
        "offered_by": copy.deepcopy(OFFERED_BY),
        "description": course["description"],
        "url": course.get("url"),
        "published": any(
            map(
                lambda course_run: course_run.get("current_price", None),
                course["courseruns"],
            )
        ),
        "topics": transform_topics(course.get("topics", [])),
        "runs": [_transform_run(course_run) for course_run in course["courseruns"]],
        "resource_type": LearningResourceType.course.value,
    }


def transform_courses(courses):
    """
    Transforms a list of courses into our normalized data structure

    Args:
        courses (list of dict): courses data

    Returns:
        list of dict: normalized courses data
    """
    return [_transform_learning_resource_course(course) for course in courses]


def transform_programs(programs):
    """Transform the xPro catalog data"""
    # normalize the xPro data into the course_catalog/models.py data structures
    return [
        {
            "readable_id": program["readable_id"],
            "title": program["title"],
            "image": {"url": program["thumbnail_url"]},
            "description": program["description"],
            "offered_by": copy.deepcopy(OFFERED_BY),
            "published": bool(
                program["current_price"]
            ),  # a program is only considered published if it has a product/price
            "url": program["url"],
            "topics": transform_topics(program.get("topics", [])),
            "platform": PlatformType.xpro.value,
            "resource_type": LearningResourceType.program.value,
            "runs": [
                {
                    "prices": [program["current_price"]]
                    if program.get("current_price", None)
                    else [],
                    "title": program["title"],
                    "run_id": program["readable_id"],
                    "enrollment_start": _parse_datetime(program["enrollment_start"]),
                    "start_date": _parse_datetime(program["start_date"]),
                    "end_date": _parse_datetime(program["end_date"]),
                    "offered_by": copy.deepcopy(OFFERED_BY),
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
