"""Tests for MicroMasters ETL functions"""

import json

# pylint: disable=redefined-outer-name
from datetime import datetime

import pytest

from learning_resources.constants import (
    Availability,
    CertificationType,
    Format,
    LearningResourceType,
    Pace,
    PlatformType,
)
from learning_resources.etl import xpro
from learning_resources.etl.constants import CourseNumberType, ETLSource
from learning_resources.etl.utils import (
    transform_delivery,
)
from learning_resources.etl.xpro import _parse_datetime, parse_topics
from learning_resources.factories import (
    LearningResourceOfferorFactory,
    LearningResourceTopicFactory,
    LearningResourceTopicMappingFactory,
)
from learning_resources.test_utils import set_up_topics
from main.test_utils import any_instance_of

pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_xpro_programs_data():
    """Mock xpro data"""
    with open("./test_json/xpro_programs.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture
def mock_xpro_courses_data():
    """Mock xpro data"""
    with open("./test_json/xpro_courses.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture
def mocked_xpro_programs_responses(mocked_responses, settings, mock_xpro_programs_data):
    """Mock the programs api response"""
    settings.XPRO_CATALOG_API_URL = "http://localhost/test/programs/api"
    mocked_responses.add(
        mocked_responses.GET,
        settings.XPRO_CATALOG_API_URL,
        json=mock_xpro_programs_data,
    )
    return mocked_responses


@pytest.fixture
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
    set_up_topics(is_xpro=True)

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
            "availability": Availability.dated.name,
            "topics": parse_topics(program_data),
            "platform": PlatformType.xpro.name,
            "resource_type": LearningResourceType.program.name,
            "delivery": transform_delivery(program_data.get("format")),
            "continuing_ed_credits": program_data.get("credits"),
            "pace": [Pace.self_paced.name],
            "format": [Format.asynchronous.name],
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
                    "delivery": transform_delivery(program_data.get("format")),
                    "availability": Availability.dated.name,
                    "pace": [Pace.self_paced.name],
                    "format": [Format.asynchronous.name],
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
                    "delivery": transform_delivery(course_data.get("format")),
                    "professional": True,
                    "published": any(
                        course_run.get("current_price", None)
                        for course_run in course_data["courseruns"]
                    ),
                    "availability": Availability.dated.name,
                    "topics": parse_topics(course_data),
                    "resource_type": LearningResourceType.course.name,
                    "continuing_ed_credits": course_data.get("credits"),
                    "pace": [Pace.self_paced.name],
                    "format": [Format.asynchronous.name],
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
                            "delivery": transform_delivery(course_data.get("format")),
                            "availability": Availability.dated.name,
                            "pace": [Pace.self_paced.name],
                            "format": [Format.asynchronous.name],
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
                    "certification": True,
                    "certification_type": CertificationType.professional.name,
                }
                for course_data in program_data["courses"]
            ],
            "certification": True,
            "certification_type": CertificationType.professional.name,
        }
        for program_data in mock_xpro_programs_data
    ]

    assert expected == result


def test_xpro_transform_courses(mock_xpro_courses_data):
    """Test that xpro courses data is correctly transformed into our normalized structure"""
    set_up_topics(is_xpro=True)

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
            "delivery": transform_delivery(course_data.get("format")),
            "published": any(
                course_run.get("current_price", None)
                for course_run in course_data["courseruns"]
            ),
            "availability": Availability.dated.name,
            "topics": parse_topics(course_data),
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
                    "delivery": transform_delivery(course_data.get("format")),
                    "availability": Availability.dated.name,
                    "pace": [Pace.self_paced.name],
                    "format": [Format.asynchronous.name],
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
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "continuing_ed_credits": course_data.get("credits"),
            "pace": [Pace.self_paced.name],
            "format": [Format.asynchronous.name],
        }
        for course_data in mock_xpro_courses_data
    ]
    assert expected == result


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("start_dt", "enrollment_dt", "expected_dt"),
    [
        (None, "2019-02-20T15:00:00", "2019-02-20T15:00:00"),
        ("2024-02-20T15:00:00", None, "2024-02-20T15:00:00"),
        ("2023-02-20T15:00:00", "2024-02-20T15:00:00", "2023-02-20T15:00:00"),
        (None, None, None),
    ],
)
def test_course_run_start_date_value(
    mock_xpro_courses_data, start_dt, enrollment_dt, expected_dt
):
    """Test that the start date value is correctly determined for course runs"""
    mock_xpro_courses_data[1]["courseruns"][0]["start_date"] = start_dt
    mock_xpro_courses_data[1]["courseruns"][0]["enrollment_start"] = enrollment_dt
    transformed_courses = xpro.transform_courses(mock_xpro_courses_data)
    assert transformed_courses[1]["runs"][0]["start_date"] == _parse_datetime(
        expected_dt
    )


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("start_dt", "enrollment_dt", "expected_dt"),
    [
        (None, "2019-02-20T15:00:00", "2019-02-20T15:00:00"),
        ("2024-02-20T15:00:00", None, "2024-02-20T15:00:00"),
        ("2023-02-20T15:00:00", "2024-02-20T15:00:00", "2023-02-20T15:00:00"),
        (None, None, None),
    ],
)
def test_program_run_start_date_value(
    mock_xpro_programs_data, start_dt, enrollment_dt, expected_dt
):
    """Test that the start date value is correctly determined for program runs"""
    mock_xpro_programs_data[0]["start_date"] = start_dt
    mock_xpro_programs_data[0]["enrollment_start"] = enrollment_dt
    transformed_programs = xpro.transform_programs(mock_xpro_programs_data)
    assert transformed_programs[0]["runs"][0]["start_date"] == _parse_datetime(
        expected_dt
    )


@pytest.mark.parametrize(
    ("raw_topics", "expected_topics"),
    [
        (["Technology:AI/Machine Learning", "Management"], ["Management"]),
        (
            ["Technology:AI/Machine Learning", "Business:Management"],
            ["AI", "Machine Learning", "Management"],
        ),
        (["Machine Learning", "Management"], ["Machine Learning", "Management"]),
        (["AI", "Machine Learning"], ["AI", "Machine Learning"]),
        (
            ["AI", "Machine Learning", "Technology:AI/Machine Learning"],
            ["AI", "Machine Learning"],
        ),
    ],
)
def test_parse_topics_data(raw_topics, expected_topics):
    """Test that topics are correctly parsed from the xpro data"""
    offeror = LearningResourceOfferorFactory.create(is_xpro=True)
    LearningResourceTopicMappingFactory.create(
        offeror=offeror,
        topic=LearningResourceTopicFactory.create(name="AI"),
        topic_name="AI/Machine Learning",
    )
    LearningResourceTopicMappingFactory.create(
        offeror=offeror,
        topic=LearningResourceTopicFactory.create(name="Machine Learning"),
        topic_name="AI/Machine Learning",
    )
    LearningResourceTopicMappingFactory.create(
        offeror=offeror,
        topic=LearningResourceTopicFactory.create(name="Management"),
        topic_name="Management",
    )
    course_data = {
        "topics": [{"name": topic} for topic in raw_topics],
    }
    assert sorted(parse_topics(course_data), key=lambda topic: topic["name"]) == sorted(
        [{"name": topic} for topic in expected_topics], key=lambda topic: topic["name"]
    )
