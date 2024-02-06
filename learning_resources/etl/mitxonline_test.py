"""Tests for MITx Online ETL functions"""

import json

# pylint: disable=redefined-outer-name
from datetime import datetime
from itertools import chain
from unittest.mock import ANY
from urllib.parse import urljoin

import pytest

from learning_resources.constants import LearningResourceType, PlatformType
from learning_resources.etl import mitxonline
from learning_resources.etl.constants import CourseNumberType, ETLSource
from learning_resources.etl.mitxonline import (
    _transform_image,
    parse_page_attribute,
)
from learning_resources.etl.utils import (
    UCC_TOPIC_MAPPINGS,
    extract_valid_department_from_id,
)
from main.test_utils import any_instance_of

pytestmark = pytest.mark.django_db


@pytest.fixture()
def mock_mitxonline_programs_data():
    """Mock mitxonline data"""
    with open("./test_json/mitxonline_programs.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mock_mitxonline_courses_data():
    """Mock mitxonline data"""
    with open("./test_json/mitxonline_courses.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mocked_mitxonline_programs_responses(
    mocked_responses, settings, mock_mitxonline_programs_data
):
    """Mock the programs api response"""
    settings.MITX_ONLINE_PROGRAMS_API_URL = "http://localhost/test/programs/api"
    mocked_responses.add(
        mocked_responses.GET,
        settings.MITX_ONLINE_PROGRAMS_API_URL,
        json=mock_mitxonline_programs_data,
    )
    return mocked_responses


@pytest.fixture()
def mocked_mitxonline_courses_responses(
    mocked_responses, settings, mock_mitxonline_courses_data
):
    """Mock the courses api response"""
    settings.MITX_ONLINE_COURSES_API_URL = "http://localhost/test/courses/api"
    mocked_responses.add(
        mocked_responses.GET,
        settings.MITX_ONLINE_COURSES_API_URL,
        json=mock_mitxonline_courses_data,
    )
    return mocked_responses


@pytest.mark.usefixtures("mocked_mitxonline_programs_responses")
def test_mitxonline_extract_programs(mock_mitxonline_programs_data):
    """Verify that the extraction function calls the mitxonline programs API and returns the responses"""
    assert mitxonline.extract_programs() == mock_mitxonline_programs_data


def test_mitxonline_extract_programs_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.MITX_ONLINE_PROGRAMS_API_URL = None
    assert mitxonline.extract_programs() == []


@pytest.mark.usefixtures("mocked_mitxonline_courses_responses")
def test_mitxonline_extract_courses(mock_mitxonline_courses_data):
    """Verify that the extraction function calls the mitxonline courses API and returns the responses"""
    assert mitxonline.extract_courses() == mock_mitxonline_courses_data


def test_mitxonline_extract_courses_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.MITX_ONLINE_COURSES_API_URL = None
    assert mitxonline.extract_courses() == []


def test_mitxonline_transform_programs(mock_mitxonline_programs_data):
    """Test that mitxonline program data is correctly transformed into our normalized structure"""
    result = mitxonline.transform_programs(mock_mitxonline_programs_data)
    expected = [
        {
            "readable_id": program_data["readable_id"],
            "title": program_data["title"],
            "offered_by": mitxonline.OFFERED_BY,
            "etl_source": ETLSource.mitxonline.name,
            "platform": PlatformType.mitxonline.name,
            "resource_type": LearningResourceType.program.name,
            "departments": [],
            "professional": False,
            "image": _transform_image(program_data),
            "description": program_data.get("page", {}).get("description", None),
            "published": bool(
                program_data.get("page", {}).get("page_url", None) is not None
            ),
            "url": parse_page_attribute(program_data, "page_url", is_url=True),
            "topics": [
                {"name": topic_name}
                for topic_name in chain.from_iterable(
                    [
                        UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                        for topic in program_data.get("topics", [])
                    ]
                )
            ],
            "runs": [
                {
                    "run_id": program_data["readable_id"],
                    "start_date": any_instance_of(datetime, type(None)),
                    "end_date": any_instance_of(datetime, type(None)),
                    "enrollment_start": any_instance_of(datetime, type(None)),
                    "enrollment_end": any_instance_of(datetime, type(None)),
                    "published": bool(
                        program_data.get("page", {}).get("page_url", None) is not None
                    ),
                    "image": _transform_image(program_data),
                    "title": program_data["title"],
                    "description": program_data.get("description", None),
                    "url": parse_page_attribute(program_data, "page_url", is_url=True),
                }
            ],
            "courses": [
                {
                    "readable_id": course_data["readable_id"],
                    "offered_by": mitxonline.OFFERED_BY,
                    "platform": PlatformType.mitxonline.name,
                    "resource_type": LearningResourceType.course.name,
                    "professional": False,
                    "etl_source": ETLSource.mitxonline.value,
                    "departments": extract_valid_department_from_id(
                        course_data["readable_id"]
                    ),
                    "title": course_data["title"],
                    "image": _transform_image(course_data),
                    "description": course_data.get("page", {}).get("description", None),
                    "published": bool(
                        course_data.get("page", {}).get("page_url", None)
                    ),
                    "url": parse_page_attribute(course_data, "page_url", is_url=True),
                    "topics": [
                        {"name": topic_name}
                        for topic_name in chain.from_iterable(
                            [
                                UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                                for topic in course_data.get("topics", [])
                            ]
                        )
                    ],
                    "runs": [
                        {
                            "run_id": course_run_data["courseware_id"],
                            "title": course_run_data["title"],
                            "image": _transform_image(course_run_data),
                            "start_date": any_instance_of(datetime, type(None)),
                            "end_date": any_instance_of(datetime, type(None)),
                            "enrollment_start": any_instance_of(datetime, type(None)),
                            "enrollment_end": any_instance_of(datetime, type(None)),
                            "url": parse_page_attribute(
                                course_data, "page_url", is_url=True
                            ),
                            "description": any_instance_of(str, type(None)),
                            "published": bool(
                                parse_page_attribute(course_data, "page_url")
                            ),
                            "prices": [
                                price
                                for price in [
                                    product.get("price")
                                    for product in course_run_data.get("products", [])
                                ]
                                if price is not None
                            ],
                            "instructors": [
                                {"full_name": instructor["name"]}
                                for instructor in parse_page_attribute(
                                    course_run_data, "instructors", is_list=True
                                )
                            ],
                        }
                        for course_run_data in course_data["courseruns"]
                    ],
                    "course": {
                        "course_numbers": [
                            {
                                "value": course_data["readable_id"],
                                "department": ANY,
                                "listing_type": CourseNumberType.primary.value,
                                "primary": True,
                                "sort_coursenum": course_data["readable_id"],
                            }
                        ]
                    },
                }
                for course_data in program_data["courses"]
                if "PROCTORED EXAM" not in course_data["title"]
            ],
        }
        for program_data in mock_mitxonline_programs_data
    ]
    assert expected == result


def test_mitxonline_transform_courses(settings, mock_mitxonline_courses_data):
    """Test that mitxonline courses data is correctly transformed into our normalized structure"""
    result = mitxonline.transform_courses(mock_mitxonline_courses_data)
    expected = [
        {
            "readable_id": course_data["readable_id"],
            "platform": PlatformType.mitxonline.name,
            "etl_source": ETLSource.mitxonline.name,
            "resource_type": LearningResourceType.course.name,
            "departments": extract_valid_department_from_id(course_data["readable_id"]),
            "title": course_data["title"],
            "image": _transform_image(course_data),
            "description": course_data.get("page", {}).get("description", None),
            "offered_by": mitxonline.OFFERED_BY,
            "published": course_data.get("page", {}).get("page_url", None) is not None,
            "professional": False,
            "topics": [
                {"name": topic_name}
                for topic_name in chain.from_iterable(
                    [
                        UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                        for topic in course_data.get("topics", [])
                    ]
                )
            ],
            "url": (
                urljoin(
                    settings.MITX_ONLINE_BASE_URL,
                    course_data["page"]["page_url"],
                )
                if course_data.get("page", {}).get("page_url")
                else None
            ),
            "runs": [
                {
                    "run_id": course_run_data["courseware_id"],
                    "title": course_run_data["title"],
                    "image": _transform_image(course_run_data),
                    "url": (
                        urljoin(
                            settings.MITX_ONLINE_BASE_URL,
                            course_data["page"]["page_url"],
                        )
                        if course_data.get("page", {}).get("page_url")
                        else None
                    ),
                    "description": course_run_data.get("page", {}).get(
                        "description", None
                    ),
                    "start_date": any_instance_of(datetime, type(None)),
                    "end_date": any_instance_of(datetime, type(None)),
                    "enrollment_start": any_instance_of(datetime, type(None)),
                    "enrollment_end": any_instance_of(datetime, type(None)),
                    "published": bool(course_data.get("page", {}).get("page_url")),
                    "prices": [
                        price
                        for price in [
                            product.get("price")
                            for product in course_run_data.get("products", [])
                        ]
                        if price is not None
                    ],
                    "instructors": [
                        {"full_name": instructor["name"]}
                        for instructor in parse_page_attribute(
                            course_run_data, "instructors", is_list=True
                        )
                    ],
                }
                for course_run_data in course_data["courseruns"]
            ],
            "course": {
                "course_numbers": [
                    {
                        "value": course_data["readable_id"],
                        "department": ANY,
                        "listing_type": CourseNumberType.primary.value,
                        "primary": True,
                        "sort_coursenum": course_data["readable_id"],
                    }
                ]
            },
        }
        for course_data in mock_mitxonline_courses_data
        if "PROCTORED EXAM" not in course_data["title"]
    ]
    assert expected == result
