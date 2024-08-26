"""
ETL extract and transformations for openedx
"""

import json
import logging
import re
from collections import namedtuple
from datetime import UTC, datetime
from pathlib import Path

import requests
from dateutil.parser import parse
from django.conf import settings
from toolz import compose

from learning_resources.constants import (
    Availability,
    CertificationType,
    LearningResourceType,
    RunStatus,
)
from learning_resources.etl.constants import COMMON_HEADERS
from learning_resources.etl.utils import (
    extract_valid_department_from_id,
    generate_course_numbers_json,
    parse_certification,
    transform_levels,
    without_none,
)
from learning_resources.utils import get_year_and_semester
from main.utils import clean_data, now_in_utc

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
    return parse(datetime_str).astimezone(UTC)


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


def _get_run_published(course_run):
    return course_run.get("status", "") == "published" and course_run.get(
        "is_enrollable", False
    )


def _get_run_availability(course_run):
    if course_run.get("availability") == RunStatus.archived.value:
        # Enrollable, archived courses can be started anytime
        return Availability.anytime

    start = course_run.get("start")
    if (
        course_run.get("pacing_type") == "self_paced"
        and start
        and datetime.fromisoformat(start) < now_in_utc()
    ):
        return Availability.anytime

    return Availability.dated


def _get_course_availability(course):
    published_runs = [
        run for run in course.get("course_runs", []) if _get_run_published(run)
    ]
    if any(_get_run_availability(run) == Availability.dated for run in published_runs):
        return Availability.dated.name
    elif published_runs and all(
        _get_run_availability(run) == Availability.anytime for run in published_runs
    ):
        return Availability.anytime.name
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
    return bool(
        "[delete]" in title
        or "(delete)" in title
        or "delete " in title
        or title == "delete"
    )


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
        "level": transform_levels([course_run.get("level_type")]),
        "semester": semester,
        "languages": without_none([course_run.get("content_language")]),
        "year": year,
        "start_date": course_run.get("start") or course_run.get("enrollment_start"),
        "end_date": course_run.get("end"),
        "last_modified": last_modified,
        "published": _get_run_published(course_run),
        "enrollment_start": course_run.get("enrollment_start"),
        "enrollment_end": course_run.get("enrollment_end"),
        "image": _transform_image(course_run.get("image")),
        "availability": course_run.get("availability"),
        "url": marketing_url
        or "{}{}/course/".format(config.alt_url, course_run.get("key")),
        "prices": sorted(
            {"0.00", *[seat.get("price") for seat in course_run.get("seats", [])]}
        ),
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
    runs = [
        _transform_course_run(config, course_run, last_modified, marketing_url)
        for course_run in course.get("course_runs", [])
        if _filter_course_run(course_run)
    ]
    has_certification = parse_certification(config.offered_by, runs)
    return {
        "readable_id": course.get("key"),
        "etl_source": config.etl_source,
        "platform": config.platform,
        "resource_type": LearningResourceType.course.name,
        "offered_by": {"code": config.offered_by},
        "title": course.get("title"),
        "departments": extract_valid_department_from_id(course.get("key")),
        "description": clean_data(course.get("short_description")),
        "full_description": clean_data(course.get("full_description")),
        "last_modified": last_modified,
        "image": _transform_image(course.get("image")),
        "url": marketing_url
        or "{}{}/course/".format(config.alt_url, course.get("key")),
        "topics": [
            {"name": subject.get("name")} for subject in course.get("subjects", [])
        ],
        "runs": runs,
        "course": {
            "course_numbers": generate_course_numbers_json(course.get("key")),
        },
        "published": any(run["published"] is True for run in runs),
        "certification": has_certification,
        "certification_type": CertificationType.completion.name
        if has_certification
        else CertificationType.none.name,
        "availability": _get_course_availability(course),
    }


def openedx_extract_transform_factory(get_config):
    """
    Factory for generating OpenEdx extract and transform functions based on the configuration

    Args:
        get_config (callable): callable to get configuration for the openedx backend

    Returns:
        OpenEdxExtractTransform: the generated extract and transform functions
    """  # noqa: D401, E501

    def extract(api_datafile=None):
        """
        Extract the OpenEdx catalog by walking all the pages

        Args:
            api_datafile (str): optional path to a local file containing the API
                data. If omitted, the API will be queried.

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

        if api_datafile:
            if settings.ENVIRONMENT != "dev":
                msg = "api_datafile should only be used in development."
                raise ValueError(msg)
            with Path(api_datafile).open("r") as file:
                log.info("Loading local API data from %s", api_datafile)
                yield from json.load(file)
        else:
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
