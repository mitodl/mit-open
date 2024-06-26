"""Professional Education ETL"""

import logging

import requests
from django.conf import settings

from learning_resources.constants import (
    OfferedBy,
)

log = logging.getLogger(__name__)


OFFERED_BY = {"code": OfferedBy.mitpe.name}


def _fetch_data(url, params=None):
    if not params:
        params = {}
    while url:
        response = requests.get(
            url, params=params, timeout=settings.REQUESTS_TIMEOUT
        ).json()
        results = response["data"]

        yield from results
        url = response.get("links", {}).get("next", {}).get("href")


def extract():
    """Loads the Professional Education data"""  # noqa: D401
    if settings.PROFESSIONAL_EDUCATION_API_URL:
        return list(_fetch_data(settings.PROFESSIONAL_EDUCATION_API_URL))
    else:
        log.warning("Missing required setting PROFESSIONAL_EDUCATION_API_URL")

    return []


def transform_course(resource_data):
    """Transform raw resource data into a format suitable for the Course model"""
    return resource_data


def transform_program(resource_data):
    """Transform raw resource data into a format suitable for the Program model"""
    return resource_data


def transform(data: dict) -> tuple[list[dict], list[dict]]:
    """Transform the Professional Education data into courses and programs"""
    programs = []
    courses = []
    for resource in data:
        program_course_data = resource.get("program_course_data", {}).get("data", [])
        if program_course_data:
            programs.append(transform_program(resource))
        else:
            courses.append(transform_course(resource))
    return courses, programs
