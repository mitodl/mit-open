"""MicroMasters ETL"""

import logging

import requests
from django.conf import settings

from learning_resources.constants import (
    Availability,
    CertificationType,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.etl.constants import COMMON_HEADERS, ETLSource
from learning_resources.models import LearningResource

OFFERED_BY = {"code": OfferedBy.mitx.name}
READABLE_ID_PREFIX = "micromasters-program-"
DEDP = "/dedp/"

log = logging.getLogger(__name__)


def extract():
    """Load the MicroMasters catalog data"""
    if settings.MICROMASTERS_CATALOG_API_URL:
        return requests.get(
            settings.MICROMASTERS_CATALOG_API_URL,
            headers={**COMMON_HEADERS},
            timeout=settings.REQUESTS_TIMEOUT,
        ).json()
    log.warning("Missing required setting MICROMASTERS_CATALOG_API_URL")
    return []


def _is_published(course_id: str) -> bool:
    """Determine if the course should be considered published"""
    existing_course = LearningResource.objects.filter(
        readable_id=course_id,
        resource_type=LearningResourceType.course.name,
        etl_source=ETLSource.mit_edx.name,
    ).first()
    if existing_course:
        return existing_course.published
    return False


def _transform_image(micromasters_data: dict) -> dict:
    """
    Transform an image into our normalized data structure

    Args:
        micromasters_data (dict): micromasters program/course/run data

    Returns:
        dict: normalized image data
    """
    image_url = micromasters_data.get("thumbnail_url")
    return {"url": image_url} if image_url else None


def transform(programs_data):
    """Transform the micromasters catalog data"""
    programs = []
    for program in programs_data:
        url = program.get("programpage_url")
        if url and DEDP not in url:
            programs.append(
                {
                    "readable_id": f"{READABLE_ID_PREFIX}{program['id']}",
                    "etl_source": ETLSource.micromasters.name,
                    "title": program["title"],
                    "platform": PlatformType.edx.name,
                    "offered_by": OFFERED_BY,
                    "url": program.get("programpage_url"),
                    "image": _transform_image(program),
                    "certification": True,
                    "certification_type": CertificationType.micromasters.name,
                    "runs": [
                        {
                            "run_id": f"{READABLE_ID_PREFIX}{program['id']}",
                            "title": program["title"],
                            "instructors": [
                                {"full_name": instructor["name"]}
                                for instructor in program["instructors"]
                            ],
                            "prices": [program["total_price"]],
                            "start_date": program["start_date"]
                            or program["enrollment_start"],
                            "end_date": program["end_date"],
                            "enrollment_start": program["enrollment_start"],
                            "availability": Availability.dated.name,
                        }
                    ],
                    "topics": program["topics"],
                    "availability": Availability.dated.name,
                    # only need positioning of courses by course_id for course data
                    "courses": [
                        {
                            "readable_id": course["edx_key"],
                            "platform": PlatformType.edx.name,
                            "offered_by": OFFERED_BY,
                            "published": _is_published(course["edx_key"]),
                            "runs": [
                                {
                                    "run_id": run["edx_course_key"],
                                }
                                for run in course["course_runs"]
                                if run.get("edx_course_key", None)
                            ],
                        }
                        for course in sorted(
                            program["courses"],
                            key=lambda course: course["position_in_program"],
                        )
                    ],
                }
            )
    return programs
