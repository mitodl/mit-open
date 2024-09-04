"""MITx learning_resources ETL"""

import logging
from _csv import QUOTE_MINIMAL
from csv import DictReader
from decimal import Decimal
from io import StringIO
from pathlib import Path

import requests
from django.conf import settings

from learning_resources.constants import (
    Availability,
    OfferedBy,
    PlatformType,
    RunAvailability,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import generate_course_numbers_json, transform_levels
from learning_resources.utils import get_year_and_semester

log = logging.getLogger(__name__)

# List of OLL course ids already ingested from OCW
SKIP_OCW_COURSES = [
    "OCW+18.031+2019_Spring",
]


def extract(sheets_id: str or None = None) -> str:
    """
    Extract OLL learning_resources

    Args:
        sheets_id (str): Google sheets id

    Returns:
        str: OLL learning_resources data as a csv-formatted string

    """
    if sheets_id:
        return requests.get(
            f"https://docs.google.com/spreadsheets/d/{sheets_id}/export?format=csv",
            timeout=settings.REQUESTS_TIMEOUT,
        ).content.decode("utf-8")
    with Path.open(
        Path(settings.BASE_DIR, "learning_resources/data/oll_metadata.csv"), "r"
    ) as csv_file:
        return csv_file.read()


def transform_image(course_data: dict) -> dict:
    """
    Transform a course image into our normalized data structure

    Args:
        course_data (dict): course data extracted from csv/sheet

    Returns:
        dict: normalized course image data

    """
    return {
        "url": course_data["Course Image URL Flat"],
        "alt": course_data["title"],
    }


def parse_topics(course_data: dict) -> list[dict]:
    """
    Transform course topics into our normalized data structure

    Args:
        course_data (dict): course data

    Returns:
        dict: list of normalized course topics data
    """
    return [
        # One topic name from GSheets is slightly incorrect
        {"name": topic.replace("Educational Policy", "Education Policy")}
        for topic in [
            course_data["MITxO Primary Child"],
            course_data["MITxO Secondary Child "],
        ]
        if topic
    ]


def transform_run(course_data: dict) -> list[dict]:
    """
    Transform a course run into our normalized data structure

    Args:
        course_data (dict): course data

    Returns:
        dict: normalized course run data
    """
    year, semester = get_year_and_semester({"key": course_data["readable_id"]})
    return [
        {
            "title": course_data["title"],
            "run_id": course_data["readable_id"],
            "url": course_data["url"],
            "published": course_data["published"] == "YES",
            "description": course_data["description"],
            "image": transform_image(course_data),
            "prices": [Decimal(0.00)],
            "level": transform_levels([course_data["Level"]])
            if course_data["Level"]
            else [],
            "year": year,
            "semester": semester,
            "instructors": [
                {"full_name": instructor}
                for instructor in [
                    course_data[f"Instructor {idx}"] for idx in range(1, 7)
                ]
                if instructor
            ],
            "availability": RunAvailability.archived.value,
        }
    ]


def transform_course(course_data: dict) -> dict:
    """
    Transform OLL course data

    Args:
        course_data (dict): course data extracted from csv/sheet

    Returns:
        dict: normalized course data

    """
    return {
        "title": course_data["title"],
        "readable_id": f"MITx+{course_data["OLL Course"]}",
        "url": course_data["url"],
        "description": course_data["description"],
        "full_description": course_data["description"],
        "offered_by": {
            "code": OfferedBy.ocw.name
            if course_data["Offered by"] == "OCW"
            else OfferedBy.mitx.name
        },
        "platform": PlatformType.oll.name,
        "published": course_data["published"] == "YES",
        "topics": parse_topics(course_data),
        "course": {
            "course_numbers": generate_course_numbers_json(
                course_data["OLL Course"], is_ocw=False
            ),
        },
        "runs": transform_run(course_data),
        "image": transform_image(course_data),
        "prices": [Decimal(0.00)],
        "etl_source": ETLSource.oll.name,
        "availability": Availability.anytime.name,
    }


def transform(courses_data: str) -> list[dict]:
    """
    Transform OLL learning_resources

    Args:
        courses_data (str): OLL learning_resources data as a csv-formatted string

    Returns:
        list of dict: normalized OLL courses data

    """
    if courses_data:
        csv_reader = DictReader(
            StringIO(courses_data), delimiter=",", quoting=QUOTE_MINIMAL
        )
        return [
            transform_course(row)
            for row in csv_reader
            if row.get("readable_id") not in SKIP_OCW_COURSES
        ]
    return []
