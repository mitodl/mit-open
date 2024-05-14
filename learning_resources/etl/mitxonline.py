"""MITX Online ETL"""

import copy
import logging
import re
from datetime import UTC
from urllib.parse import urljoin

import requests
from dateutil.parser import parse
from django.conf import settings

from learning_resources.constants import (
    AvailabilityType,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import (
    generate_course_numbers_json,
    parse_certification,
    transform_topics,
)
from learning_resources.models import LearningResourceDepartment

log = logging.getLogger(__name__)

EXCLUDE_REGEX = r"PROCTORED EXAM"

OFFERED_BY = {"code": OfferedBy.mitx.name}


def _parse_datetime(value):
    """
    Parses an MITx Online datetime string

    Args:
        value(str): the datetime in string format

    Returns:
        datetime: the parsed datetime
    """  # noqa: D401
    return parse(value).replace(tzinfo=UTC) if value else None


def parse_page_attribute(
    mitx_json,
    attribute,
    is_url=False,  # noqa: FBT002
    is_list=False,  # noqa: FBT002
):
    """
    Extracts an MITX Online page attribute

    Args:
        mitx_json(dict): the course/run/program JSON object containing the page element
        attribute(str): the name of the attribute to extract
        is_url(bool): True if the attribute is a url
        is_list(bool): True if the attribute is a list

    Returns:
        str or list or None: The attribute value
    """  # noqa: D401
    default_value = [] if is_list else None
    page = mitx_json.get("page", {}) or {}
    attribute = page.get(attribute, default_value)
    if attribute:
        return (
            urljoin(settings.MITX_ONLINE_BASE_URL, attribute) if is_url else attribute
        )
    return default_value


def parse_mitxonline_departments(departments):
    """Map the MITx Online departments to Open ones"""

    return [mxo_dept["name"] for mxo_dept in departments]


def extract_programs():
    """Loads the MITx Online catalog data"""  # noqa: D401
    if settings.MITX_ONLINE_PROGRAMS_API_URL:
        return requests.get(settings.MITX_ONLINE_PROGRAMS_API_URL).json()  # noqa: S113
    log.warning("Missing required setting MITX_ONLINE_PROGRAMS_API_URL")
    return []


def extract_courses():
    """Loads the MITx Online catalog data"""  # noqa: D401
    if settings.MITX_ONLINE_COURSES_API_URL:
        return requests.get(settings.MITX_ONLINE_COURSES_API_URL).json()  # noqa: S113
    log.warning("Missing required setting MITX_ONLINE_COURSES_API_URL")
    return []


def parse_program_prices(program_data: dict) -> list[float]:
    """Return a list of unique prices for a program"""
    prices = [program_data.get("current_price") or 0.00]
    price_string = parse_page_attribute(program_data, "price")
    if price_string:
        prices.extend(
            [
                float(price.replace(",", ""))
                for price in re.findall(r"[\d\.,]+", price_string)
            ]
        )
    return sorted(set(prices))


def _transform_image(mitxonline_data: dict) -> dict:
    """
    Transforms an image into our normalized data structure

    Args:
        mitxonline_data (dict): mitxonline data

    Returns:
        dict: normalized image data
    """  # noqa: D401
    image_url = parse_page_attribute(mitxonline_data, "feature_image_src", is_url=True)
    return {"url": image_url} if image_url else None


def _transform_run(course_run: dict, course: dict) -> dict:
    """
    Transforms a course run into our normalized data structure

    Args:
        course_run (dict): course run data

    Returns:
        dict: normalized course run data
    """  # noqa: D401
    return {
        "title": course_run["title"],
        "run_id": course_run["courseware_id"],
        "start_date": _parse_datetime(
            course_run.get("start_date") or course_run.get("enrollment_start")
        ),
        "end_date": _parse_datetime(course_run.get("end_date")),
        "enrollment_start": _parse_datetime(course_run.get("enrollment_start")),
        "enrollment_end": _parse_datetime(course_run.get("enrollment_end")),
        "url": parse_page_attribute(course, "page_url", is_url=True),
        "published": bool(parse_page_attribute(course, "page_url")),
        "description": parse_page_attribute(course_run, "description"),
        "image": _transform_image(course_run),
        "prices": [
            price
            for price in [
                product.get("price") for product in course_run.get("products", [])
            ]
            if price is not None
        ],
        "instructors": [
            {"full_name": instructor["name"]}
            for instructor in parse_page_attribute(course, "instructors", is_list=True)
        ],
    }


def _transform_course(course):
    """
    Transforms a course into our normalized data structure

    Args:
        course (dict): course data

    Returns:
        dict: normalized course data
    """  # noqa: D401
    return {
        "readable_id": course["readable_id"],
        "platform": PlatformType.mitxonline.name,
        "etl_source": ETLSource.mitxonline.name,
        "resource_type": LearningResourceType.course.name,
        "title": course["title"],
        "offered_by": copy.deepcopy(OFFERED_BY),
        "topics": transform_topics(course.get("topics", [])),
        "departments": parse_mitxonline_departments(course["departments"]),
        "runs": [
            _transform_run(course_run, course) for course_run in course["courseruns"]
        ],
        "course": {
            "course_numbers": generate_course_numbers_json(
                course["readable_id"], is_ocw=False
            ),
        },
        "published": bool(
            parse_page_attribute(course, "page_url")
        ),  # a course is only considered published if it has a page url
        "professional": False,
        "certification": parse_certification(OFFERED_BY, course.get("courseruns", [])),
        "image": _transform_image(course),
        "url": parse_page_attribute(course, "page_url", is_url=True),
        "description": parse_page_attribute(course, "description"),
    }


def transform_courses(courses):
    """
    Transforms a list of courses into our normalized data structure

    Args:
        courses (list of dict): courses data

    Returns:
        list of dict: normalized courses data
    """  # noqa: D401
    return [
        _transform_course(course)
        for course in courses
        if not re.search(EXCLUDE_REGEX, course["title"], re.IGNORECASE)
    ]


def transform_programs(programs):
    """Transform the MITX Online catalog data"""
    # normalize the MITx Online data
    return [
        {
            "readable_id": program["readable_id"],
            "title": program["title"],
            "offered_by": OFFERED_BY,
            "etl_source": ETLSource.mitxonline.name,
            "resource_type": LearningResourceType.program.name,
            "departments": parse_mitxonline_departments(program["departments"]),
            "platform": PlatformType.mitxonline.name,
            "professional": False,
            "certification": bool(parse_page_attribute(program, "page_url")),
            "topics": transform_topics(program.get("topics", [])),
            "description": parse_page_attribute(program, "description"),
            "url": parse_page_attribute(program, "page_url", is_url=True),
            "image": _transform_image(program),
            "published": bool(
                parse_page_attribute(program, "page_url")
            ),  # a program is only considered published if it has a page url
            "runs": [
                {
                    "run_id": program["readable_id"],
                    "enrollment_start": _parse_datetime(
                        program.get("enrollment_start")
                    ),
                    "enrollment_end": _parse_datetime(program.get("enrollment_end")),
                    "start_date": _parse_datetime(
                        program.get("start_date") or program.get("enrollment_start")
                    ),
                    "end_date": _parse_datetime(program.get("end_date")),
                    "title": program["title"],
                    "published": bool(
                        parse_page_attribute(program, "page_url")
                    ),  # program only considered published if it has a product/price
                    "url": parse_page_attribute(program, "page_url", is_url=True),
                    "image": _transform_image(program),
                    "description": parse_page_attribute(program, "description"),
                    "prices": parse_program_prices(program),
                    "availability": AvailabilityType.current.name
                    if parse_page_attribute(program, "page_url")
                    else AvailabilityType.archived.name,
                }
            ],
            "courses": [
                _transform_course(course)
                for course in program["courses"]
                if not re.search(EXCLUDE_REGEX, course["title"], re.IGNORECASE)
            ],
        }
        for program in programs
    ]
