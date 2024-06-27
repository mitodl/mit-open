"""Professional Education ETL"""

import logging
from datetime import UTC, datetime
from urllib.parse import urljoin

import requests
from django.conf import settings

from learning_resources.constants import (
    CertificationType,
    OfferedBy,
    PlatformType,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import clean_data, transform_format, transform_topics
from main.utils import now_in_utc

log = logging.getLogger(__name__)

BASE_URL = "https://professional.mit.edu/"
OFFERED_BY = {"code": OfferedBy.mitpe.name}
UNIQUE_FIELD = "url"


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


def parse_topics(document: dict) -> list[dict]:
    """
    Get a list containing one {"name": <topic>} dict object

    Args:
        document: course or program data

    Returns:
        list of dict: list containing one topic dict with a name attribute
    """
    topic_data = document["field_course_topics"]
    topic_url = topic_data["links"].get("related", {}).get("href")
    if topic_data["data"] and topic_url:
        topic_data = _fetch_data(topic_url)
        return transform_topics(
            [{"name": topic["attributes"]["name"]} for topic in topic_data]
        )
    return []


def parse_image(document: dict) -> dict or None:
    """
    Create a dict object representing the resource image

    Args:
        document: course or program data

    Returns:
        dict: json representation of the image
    """
    img_url = (
        document["attributes"]["field_featured_course_image"]
        .get("links", {})
        .get("relaetd", {})
        .get("href")
    )
    if img_url:
        img_metadata = _fetch_data(img_url)
        field_image = img_metadata["data"]["relationships"]["field_media_image"]
        img_url_2 = field_image["links"]["related"]["href"]
        if img_url_2:
            img_src_metadata = _fetch_data(img_url_2)
            img_path = img_src_metadata["data"]["attributes"]["uri"]["url"]
            if img_path:
                img_src = urljoin(BASE_URL, img_path)
                return {
                    "alt": field_image.get("data", {}).get("meta", {}).get("alt"),
                    "description": field_image.get("data", {})
                    .get("meta", {})
                    .get("title"),
                    "url": img_src,
                }
    return None


def parse_date(date_str: str) -> datetime or None:
    """
    Get a datetime value from an list containing one integer

    Args:
        date_str: string representing a date

    Returns:
        datetime: start or end date
    """
    if str:
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=UTC)
    return None


def parse_resource_url(resource_data: dict) -> str:
    """Return the url for the resource"""
    return urljoin(BASE_URL, resource_data["attributes"]["path"]["alias"])


def _transform_runs(resource_data: dict) -> list[dict]:
    """
    Transform a course/program run into our normalized data structure

    Args:
        resource_data (dict): course/program data

    Returns:
        dict: normalized course/program data
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
        if (
            start_date
            and datetime.strptime(start_date, "%Y-%m-%s").replace(tzinfo=UTC) >= now
        ) or (enrollment_end_date and enrollment_end_date >= now):
            runs.append(
                {
                    "run_id": f'{resource_data["id"]}_{resource_date.get("value")}',
                    "title": resource_data["attributes"]["title"],
                    "start_date": start_date,
                    "end_date": end_date,
                    "enrollment_end_date": enrollment_end_date,
                    "published": True,
                    "prices": [price] if price else [],
                    "url": parse_resource_url(resource_data),
                }
            )
    return runs


def transform_course(resource_data):
    """Transform raw resource data into a format suitable for the Course model"""
    runs = _transform_runs(resource_data)
    if len(runs) > 0:
        return {
            "readable_id": "",
            "offered_by": OFFERED_BY,
            "platform": PlatformType.mitpe.name,
            "etl_source": ETLSource.prof_ed.name,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "title": resource_data["attributes"]["title"],
            "url": parse_resource_url(resource_data),
            "image": parse_image(resource_data),
            "description": clean_data(resource_data["attributes"]["body"]["processed"]),
            "course": {
                "course_numbers": [],
            },
            "learning_format": transform_format(resource_data["field_course_location"]),
            "published": not resource_data["attributes"][
                "field_do_not_show_in_catalog"
            ],
            "topics": parse_topics(resource_data),
            "runs": runs,
            "unique_field": UNIQUE_FIELD,
        }
    return None


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


sample = """
       "field_program_courses": {
          "data": [
            {
              "type": "node--course",
              "id": "528a8be1-ae08-47b1-8c72-e3d35e43cd4b",
              "meta": {
                "drupal_internal__target_id": 402
              }
            },
            {
              "type": "node--course",
              "id": "255c7320-328e-4730-9277-87bfa8d006f8",
              "meta": {
                "drupal_internal__target_id": 408
              }
            },
            {
              "type": "node--course",
              "id": "45c76489-d061-42e1-ab26-3eb5ad7a2297",
              "meta": {
                "drupal_internal__target_id": 409
              }
            },
            {
              "type": "node--course",
              "id": "d73c1cd1-c965-47b6-8b6e-b6b6e2816d0e",
              "meta": {
                "drupal_internal__target_id": 516
              }
            },
            {
              "type": "node--course",
              "id": "88fd8479-0074-47d6-b08a-aa29d32c7c39",
              "meta": {
                "drupal_internal__target_id": 416
              }
            }
          ],
          "links": {
            "related": {
              "href": "https://professional.mit.edu/jsonapi/node/course/30af3543-f38e-4548-bcfa-d0edec1e5183/field_program_courses?resourceVersion=id%3A14231"
            },
            "self": {
              "href": "https://professional.mit.edu/jsonapi/node/course/30af3543-f38e-4548-bcfa-d0edec1e5183/relationships/field_program_courses?resourceVersion=id%3A14231"
            }
          }
        },
"""
