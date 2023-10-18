"""
ETL extract and transformations for openedx
"""
import logging
import re
from collections import namedtuple

import pytz
import requests
from dateutil.parser import parse
from toolz import compose

from learning_resources.constants import LearningResourceType
from learning_resources.etl.constants import COMMON_HEADERS
from learning_resources.etl.utils import extract_valid_department_from_id
from learning_resources.utils import get_year_and_semester

MIT_OWNER_KEYS = ["MITx", "MITx_PRO"]

OpenEdxConfiguration = namedtuple(  # noqa: PYI024
    "OpenEdxConfiguration",
    [
        "client_id",
        "client_secret",
        "access_token_url",
        "api_url",
        "base_url",
        "alt_url",
        "platform",
        "offered_by",
        "etl_source",
    ],
)
OpenEdxExtractTransform = namedtuple(  # noqa: PYI024
    "OpenEdxExtractTransform", ["extract", "transform"]
)

log = logging.getLogger()


def _get_access_token(config):
    """
    Get an access token for edx

    Args:
        config (OpenEdxConfiguration): configuration for the openedx backend

    Returns:
        str: the access token
    """
    payload = {
        "grant_type": "client_credentials",
        "client_id": config.client_id,
        "client_secret": config.client_secret,
        "token_type": "jwt",
    }
    response = requests.post(  # noqa: S113
        config.access_token_url, data=payload, headers={**COMMON_HEADERS}
    )
    response.raise_for_status()

    return response.json()["access_token"]


def _get_openedx_catalog_page(url, access_token):
    """
    Fetch a page of OpenEdx catalog data

    Args:
        url (str): the url to fetch data from
        access_token (str): the access token to use

    Returns:
        tuple(list of dict, str or None): a tuple with the next set of courses and the url to the next page of results, if any
    """  # noqa: E501
    response = requests.get(  # noqa: S113
        url, headers={**COMMON_HEADERS, "Authorization": f"JWT {access_token}"}
    )
    response.raise_for_status()

    data = response.json()

    return data["results"], data["next"]


def _parse_openedx_datetime(datetime_str):
    """
    Parses an OpenEdx datetime string

    Args:
        datetime_str (str): the datetime as a string

    Returns:
        str: the parsed datetime
    """  # noqa: D401
    return parse(datetime_str).astimezone(pytz.utc)


def _get_course_marketing_url(config, course):
    """
    Get the url for a course if any

    Args:
        config (OpenEdxConfiguration): configuration for the openedx backend
        course (dict): the data for the course

    Returns:
        str: The url for the course if any
    """
    marketing_url = course.get("marketing_url", "")
    if not marketing_url:
        for course_run in sorted(
            course.get("course_runs", []), key=lambda x: x["start"], reverse=True
        ):
            marketing_url = course_run.get("marketing_url", "")
            if marketing_url:
                break
    if marketing_url and re.match(
        rf"^{config.base_url}|{config.alt_url}", marketing_url
    ):
        return marketing_url.split("?")[0]
    return None


def _is_course_or_run_deleted(title):
    """
    Returns True if '[delete]', 'delete ' (note the ending space character)
    exists in a course's title or if the course title equals 'delete' for the
    purpose of skipping the course

    Args:
        title (str): The course.title of the course

    Returns:
        bool: True if the course or run should be considered deleted

    """  # noqa: D401
    title = title.strip().lower()
    if (
        "[delete]" in title
        or "(delete)" in title
        or "delete " in title
        or title == "delete"
    ):
        return True
    return False


def _filter_course(course):
    """
    Filter courses to onces that are valid to ingest

    Args:
        course (dict): the course data

    Returns:
        bool: True if the course should be ingested
    """
    return not _is_course_or_run_deleted(course.get("title")) and course.get(
        "course_runs", []
    )


def _filter_course_run(course_run):
    """
    Filter course runs to onces that are valid to ingest

    Args:
        course_run (dict): the course run data

    Returns:
        bool: True if the course run should be ingested
    """
    return not _is_course_or_run_deleted(course_run.get("title"))


def _transform_image(image_data: dict) -> dict:
    """Return the transformed image data if a url is provided"""
    if image_data and image_data.get("src"):
        return {
            "url": image_data.get("src"),
            "description": image_data.get("description"),
        }
    return None


def _transform_course_run(config, course_run, course_last_modified, marketing_url):
    """
    Transform a course run into the normalized data structure

    Args:
        config (OpenEdxConfiguration): configuration for the openedx backend

    Returns:
        dict: the tranformed course run data
    """
    year, semester = get_year_and_semester(course_run)
    course_run_last_modified = _parse_openedx_datetime(course_run.get("modified"))
    last_modified = max(course_last_modified, course_run_last_modified)
    return {
        "run_id": course_run.get("key"),
        "title": course_run.get("title"),
        "description": course_run.get("short_description"),
        "full_description": course_run.get("full_description"),
        "level": course_run.get("level_type"),
        "semester": semester,
        "languages": [course_run.get("content_language")],
        "year": year,
        "start_date": course_run.get("start"),
        "end_date": course_run.get("end"),
        "last_modified": last_modified,
        "published": course_run.get("status", "") == "published",
        "enrollment_start": course_run.get("enrollment_start"),
        "enrollment_end": course_run.get("enrollment_end"),
        "image": _transform_image(course_run.get("image")),
        "availability": course_run.get("availability"),
        "url": marketing_url
        or "{}{}/course/".format(config.alt_url, course_run.get("key")),
        "prices": [seat.get("price") for seat in course_run.get("seats")],
        "instructors": [
            {
                "first_name": person.get("given_name"),
                "last_name": person.get("family_name"),
            }
            for person in course_run.get("staff")
        ],
    }


def _transform_course(config, course):
    """
    Filter courses to onces that are valid to ingest

    Args:
        config (OpenEdxConfiguration): configuration for the openedx backend
        course (dict): the course data

    Returns:
        dict: the tranformed course data
    """
    last_modified = _parse_openedx_datetime(course.get("modified"))
    marketing_url = _get_course_marketing_url(config, course)
    return {
        "readable_id": course.get("key"),
        "etl_source": config.etl_source,
        "platform": config.platform,
        "resource_type": LearningResourceType.course.value,
        "offered_by": {"name": config.offered_by},
        "title": course.get("title"),
        "departments": extract_valid_department_from_id(course.get("key")),
        "description": course.get("short_description"),
        "full_description": course.get("full_description"),
        "last_modified": last_modified,
        "image": _transform_image(course.get("image")),
        "url": marketing_url
        or "{}{}/course/".format(config.alt_url, course.get("key")),
        "topics": [
            {"name": subject.get("name")} for subject in course.get("subjects", [])
        ],
        "runs": [
            _transform_course_run(config, course_run, last_modified, marketing_url)
            for course_run in course.get("course_runs", [])
            if _filter_course_run(course_run)
        ],
        "published": any(
            run["status"] == "published" for run in course.get("course_runs", [])
        ),
    }


def openedx_extract_transform_factory(get_config):
    """
    Factory for generating OpenEdx extract and transform functions based on the configuration

    Args:
        get_config (callable): callable to get configuration for the openedx backend

    Returns:
        OpenEdxExtractTransform: the generated extract and transform functions
    """  # noqa: D401, E501

    def extract():
        """
        Extract the OpenEdx catalog by walking all the pages

        Yields:
            dict: an object representing each course
        """
        config = get_config()

        if not all(
            [
                config.client_id,
                config.client_secret,
                config.access_token_url,
                config.api_url,
                config.base_url,
                config.alt_url,
            ]
        ):
            return []

        access_token = _get_access_token(config)
        url = config.api_url

        while url:
            courses, url = _get_openedx_catalog_page(url, access_token)
            yield from courses

    def transform(courses):
        """
        Transforms the extracted openedx data into our normalized data structure

        Args:
            list of dict: the merged catalog responses

        Returns:
            list of dict: the tranformed courses data

        """  # noqa: D401
        config = get_config()

        return [
            _transform_course(config, course)
            for course in courses
            if _filter_course(course)
        ]

    return OpenEdxExtractTransform(
        compose(list, extract),  # ensure a list, not a a generator, is returned
        transform,
    )
