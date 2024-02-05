"""Tests for MicroMasters ETL functions"""

import json

# pylint: disable=redefined-outer-name
from datetime import datetime
from itertools import chain

import pytest

from learning_resources.constants import LearningResourceType, PlatformType
from learning_resources.etl import xpro
from learning_resources.etl.constants import CourseNumberType, ETLSource
from learning_resources.etl.utils import UCC_TOPIC_MAPPINGS
from main.test_utils import any_instance_of

pytestmark = pytest.mark.django_db


@pytest.fixture()
def mock_xpro_programs_data():
    """Mock xpro data"""
    with open("./test_json/xpro_programs.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mock_xpro_courses_data():
    """Mock xpro data"""
    with open("./test_json/xpro_courses.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mocked_xpro_programs_responses(mocked_responses, settings, mock_xpro_programs_data):
    """Mock the programs api response"""
    settings.XPRO_CATALOG_API_URL = "http://localhost/test/programs/api"
    mocked_responses.add(
        mocked_responses.GET,
        settings.XPRO_CATALOG_API_URL,
        json=mock_xpro_programs_data,
    )
    return mocked_responses


@pytest.fixture()
def mocked_xpro_courses_responses(mocked_responses, settings, mock_xpro_courses_data):
    """Mock the courses api response"""
    settings.XPRO_COURSES_API_URL = "http://localhost/test/courses/api"
    mocked_responses.add(
        mocked_responses.GET, settings.XPRO_COURSES_API_URL, json=mock_xpro_courses_data
    )
    return mocked_responses


@pytest.mark.usefixtures("mocked_xpro_programs_responses")
def test_xpro_extract_programs(mock_xpro_programs_data):
    """Verify that the extraction function calls the xpro programs API and returns the responses"""
    assert xpro.extract_programs() == mock_xpro_programs_data


def test_xpro_extract_programs_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.XPRO_CATALOG_API_URL = None
    assert xpro.extract_programs() == []


@pytest.mark.usefixtures("mocked_xpro_courses_responses")
def test_xpro_extract_courses(mock_xpro_courses_data):
    """Verify that the extraction function calls the xpro courses API and returns the responses"""
    assert xpro.extract_courses() == mock_xpro_courses_data


def test_xpro_extract_courses_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.XPRO_COURSES_API_URL = None
    assert xpro.extract_courses() == []


def test_xpro_transform_programs(mock_xpro_programs_data):
    """Test that xpro program data is correctly transformed into our normalized structure"""
    result = xpro.transform_programs(mock_xpro_programs_data)
    expected = [
        {
            "readable_id": program_data["readable_id"],
            "etl_source": ETLSource.xpro.name,
            "title": program_data["title"],
            "image": {"url": program_data["thumbnail_url"]},
            "description": program_data["description"],
            "offered_by": xpro.OFFERED_BY,
            "professional": True,
            "published": bool(program_data["current_price"]),
            "url": program_data["url"],
            "topics": [
                {"name": topic_name}
                for topic_name in chain.from_iterable(
                    [
                        UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                        for topic in program_data.get("topics", [])
                    ]
                )
            ],
            "platform": PlatformType.xpro.name,
            "resource_type": LearningResourceType.program.name,
            "runs": [
                {
                    "run_id": program_data["readable_id"],
                    "title": program_data["title"],
                    "start_date": any_instance_of(datetime, type(None)),
                    "end_date": any_instance_of(datetime, type(None)),
                    "enrollment_start": any_instance_of(datetime, type(None)),
                    "prices": (
                        [program_data["current_price"]]
                        if program_data["current_price"]
                        else []
                    ),
                    "instructors": [
                        {"full_name": instructor["name"]}
                        for instructor in program_data.get("instructors", [])
                    ],
                    "description": program_data["description"],
                }
            ],
            "courses": [
                {
                    "readable_id": course_data["readable_id"],
                    "etl_source": ETLSource.xpro.name,
                    "platform": PlatformType.xpro.name,
                    "title": course_data["title"],
                    "image": {"url": course_data["thumbnail_url"]},
                    "description": course_data["description"],
                    "url": course_data.get("url", None),
                    "offered_by": xpro.OFFERED_BY,
                    "professional": True,
                    "published": any(
                        course_run.get("current_price", None)
                        for course_run in course_data["courseruns"]
                    ),
                    "topics": [
                        {"name": topic_name}
                        for topic_name in chain.from_iterable(
                            [
                                UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                                for topic in course_data.get("topics", [])
                            ]
                        )
                    ],
                    "resource_type": LearningResourceType.course.name,
                    "runs": [
                        {
                            "run_id": course_run_data["courseware_id"],
                            "title": course_run_data["title"],
                            "start_date": any_instance_of(datetime, type(None)),
                            "end_date": any_instance_of(datetime, type(None)),
                            "enrollment_start": any_instance_of(datetime, type(None)),
                            "enrollment_end": any_instance_of(datetime, type(None)),
                            "published": bool(course_run_data["current_price"]),
                            "prices": (
                                [course_run_data["current_price"]]
                                if course_run_data["current_price"]
                                else []
                            ),
                            "instructors": [
                                {"full_name": instructor["name"]}
                                for instructor in course_run_data["instructors"]
                            ],
                        }
                        for course_run_data in course_data["courseruns"]
                    ],
                    "course": {
                        "course_numbers": [
                            {
                                "value": course_data["readable_id"],
                                "department": None,
                                "listing_type": CourseNumberType.primary.value,
                                "primary": True,
                                "sort_coursenum": course_data["readable_id"],
                            }
                        ]
                    },
                }
                for course_data in program_data["courses"]
            ],
        }
        for program_data in mock_xpro_programs_data
    ]
    assert expected == result


def test_xpro_transform_courses(mock_xpro_courses_data):
    """Test that xpro courses data is correctly transformed into our normalized structure"""
    result = xpro.transform_courses(mock_xpro_courses_data)
    expected = [
        {
            "readable_id": course_data["readable_id"],
            "etl_source": ETLSource.xpro.name,
            "platform": PlatformType.xpro.name,
            "title": course_data["title"],
            "image": {"url": course_data["thumbnail_url"]},
            "professional": True,
            "description": course_data["description"],
            "url": course_data.get("url"),
            "offered_by": xpro.OFFERED_BY,
            "published": any(
                course_run.get("current_price", None)
                for course_run in course_data["courseruns"]
            ),
            "topics": [
                {"name": topic_name}
                for topic_name in chain.from_iterable(
                    [
                        UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                        for topic in course_data.get("topics", [])
                    ]
                )
            ],
            "resource_type": LearningResourceType.course.name,
            "runs": [
                {
                    "run_id": course_run_data["courseware_id"],
                    "title": course_run_data["title"],
                    "start_date": any_instance_of(datetime, type(None)),
                    "end_date": any_instance_of(datetime, type(None)),
                    "enrollment_start": any_instance_of(datetime, type(None)),
                    "enrollment_end": any_instance_of(datetime, type(None)),
                    "published": bool(course_run_data["current_price"]),
                    "prices": (
                        [course_run_data["current_price"]]
                        if course_run_data["current_price"]
                        else []
                    ),
                    "instructors": [
                        {"full_name": instructor["name"]}
                        for instructor in course_run_data["instructors"]
                    ],
                }
                for course_run_data in course_data["courseruns"]
            ],
            "course": {
                "course_numbers": [
                    {
                        "value": course_data["readable_id"],
                        "department": None,
                        "listing_type": CourseNumberType.primary.value,
                        "primary": True,
                        "sort_coursenum": course_data["readable_id"],
                    }
                ]
            },
        }
        for course_data in mock_xpro_courses_data
    ]
    assert expected == result
