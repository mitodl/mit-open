"""MicroMasters course catalog ETL"""

import requests
from django.conf import settings

from learning_resources.constants import LearningResourceType, OfferedBy, PlatformType
from learning_resources.etl.constants import COMMON_HEADERS, ETLSource
from learning_resources.models import LearningResource

OFFERED_BY = {"name": OfferedBy.mitx.value}
READABLE_ID_PREFIX = "micromasters-program-"
MITXONLINE_PREFIX = "course-v1:"
DEDP = "/dedp/"


def _get_platform(program_url: str) -> str:
    """Get the correct platform for a program"""
    if DEDP in program_url:
        return PlatformType.mitxonline.value
    return PlatformType.edx.value


def _get_course_id(program_url: str, edx_key: str) -> str:
    """Get the correct readable id for a course"""
    if DEDP in program_url and not edx_key.startswith(MITXONLINE_PREFIX):
        return f"{MITXONLINE_PREFIX}{edx_key}"
    return edx_key


def extract():
    """Loads the MicroMasters catalog data"""  # noqa: D401
    if settings.MICROMASTERS_CATALOG_API_URL:
        return requests.get(  # noqa: S113
            settings.MICROMASTERS_CATALOG_API_URL, headers={**COMMON_HEADERS}
        ).json()
    return []


def _is_published(course_id: str) -> bool:
    """Determine if the course should be considered published"""
    existing_course = LearningResource.objects.filter(
        readable_id=course_id,
        resource_type=LearningResourceType.course.value,
        etl_source__in=[ETLSource.mit_edx.value, ETLSource.mitxonline.value],
    ).first()
    if existing_course:
        return existing_course.published
    return False


def _transform_image(micromasters_data: dict) -> dict:
    """
    Transforms an image into our normalized data structure

    Args:
        micromasters_data (dict): micromasters program/course/run data

    Returns:
        dict: normalized image data
    """  # noqa: D401
    image_url = micromasters_data.get("thumbnail_url")
    return {"url": image_url} if image_url else None


def transform(programs):
    """Transform the micromasters catalog data"""
    return [
        {
            "readable_id": f"{READABLE_ID_PREFIX}{program['id']}",
            "etl_source": ETLSource.micromasters.value,
            "title": program["title"],
            "platform": _get_platform(program["programpage_url"]),
            "offered_by": OFFERED_BY,
            "url": program["programpage_url"],
            "image": _transform_image(program),
            "runs": [
                {
                    "run_id": program["id"],
                    "title": program["title"],
                    "instructors": [
                        {"full_name": instructor["name"]}
                        for instructor in program["instructors"]
                    ],
                    "prices": [program["total_price"]],
                    "start_date": program["start_date"],
                    "end_date": program["end_date"],
                    "enrollment_start": program["enrollment_start"],
                }
            ],
            "topics": program["topics"],
            # only need positioning of courses by course_id for course data
            "courses": [
                {
                    "readable_id": _get_course_id(
                        program["programpage_url"], course["edx_key"]
                    ),
                    "published": _is_published(course["edx_key"]),
                    "platform": _get_platform(program["programpage_url"]),
                    "offered_by": OFFERED_BY,
                    "runs": [
                        {
                            "run_id": run["edx_course_key"],
                        }
                        for run in course["course_runs"]
                        if run.get("edx_course_key", None)
                    ],
                }
                for course in sorted(
                    program["courses"], key=lambda course: course["position_in_program"]
                )
            ],
        }
        for program in programs
    ]
