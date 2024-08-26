"""Tests for prolearn etl functions"""

import json
from urllib.parse import urljoin

import pytest

from learning_resources.constants import (
    Availability,
    RunAvailability,
)
from learning_resources.etl.sloan import (
    extract,
    parse_availability,
    parse_datetime,
    parse_image,
    transform_course,
    transform_format,
    transform_run,
)
from learning_resources.factories import (
    LearningResourceOfferorFactory,
    LearningResourceTopicMappingFactory,
)

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def mock_sloan_api_setting(settings):  # noqa: PT004
    """Set the prolearn api url"""
    settings.SEE_API_URL = "http://localhost/test/programs/api"
    settings.SEE_API_CLIENT_ID = "test"
    settings.SEE_API_CLIENT_SECRET = "test"  # noqa: S105
    settings.SEE_API_ACCESS_TOKEN_URL = "http://localhost/test/access-token"  # noqa: S105
    settings.SEE_API_ENABLED = True


@pytest.fixture()
def mock_sloan_courses_data():
    """Mock prolearn MIT Professional Education courses data"""
    with open("./test_json/test_sloan_courses.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mock_sloan_runs_data():
    """Mock prolearn MIT Professional Education courses data"""
    with open("./test_json/test_sloan_runs.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mocked_sloan_auth_token_response(
    mocked_responses, settings, mock_sloan_runs_data, mock_sloan_api_setting
):
    mocked_responses.add(
        mocked_responses.POST,
        settings.SEE_API_ACCESS_TOKEN_URL,
        json={"access_token": "test"},
    )
    return mocked_responses


@pytest.fixture()
def mocked_sloan_course_runs_responses(
    mocked_responses, settings, mock_sloan_runs_data, mock_sloan_api_setting
):
    mocked_responses.add(
        mocked_responses.GET,
        urljoin(settings.SEE_API_URL, "course-offerings"),
        json=mock_sloan_runs_data,
    )
    return mocked_responses


@pytest.fixture()
def mocked_sloan_courses_responses(
    mocked_responses, settings, mock_sloan_courses_data, mock_sloan_api_setting
):
    mocked_responses.add(
        mocked_responses.GET,
        urljoin(settings.SEE_API_URL, "courses"),
        json=mock_sloan_courses_data,
    )
    return mocked_responses


@pytest.mark.usefixtures(
    "mocked_sloan_auth_token_response",
    "mocked_sloan_courses_responses",
    "mocked_sloan_course_runs_responses",
)
def test_sloan_extract_programs(
    mocked_sloan_auth_token_response,
    mock_sloan_courses_data,
    mock_sloan_runs_data,
    mock_sloan_api_setting,
):
    """Verify that the extraction function calls the sloans courses API and returns the courses and runs"""
    extracted = extract()
    assert extracted[0] == mock_sloan_courses_data
    assert extracted[1] == mock_sloan_runs_data


def test_transform_run(
    mock_sloan_courses_data,
    mock_sloan_runs_data,
):
    run_data = mock_sloan_runs_data[0]
    course_data = mock_sloan_courses_data[0]
    faculty_names = (
        run_data["Faculty_Name"].split(",") if run_data["Faculty_Name"] else []
    )
    assert transform_run(run_data, course_data) == {
        "run_id": run_data["CO_Title"],
        "start_date": parse_datetime(run_data["Start_Date"]),
        "end_date": parse_datetime(run_data["End_Date"]),
        "title": course_data["Title"],
        "url": course_data["URL"],
        "availability": RunAvailability.current.value,
        "published": True,
        "prices": [run_data["Price"]],
        "instructors": [{"full_name": name.strip()} for name in faculty_names],
    }


def test_transform_course(mock_sloan_courses_data, mock_sloan_runs_data):
    course_data = mock_sloan_courses_data[0]
    runs_data = mock_sloan_runs_data[0:10]
    course_runs_data = [
        run for run in runs_data if run["Course_Id"] == course_data["Course_Id"]
    ]

    transformed = transform_course(course_data, runs_data)

    assert transformed["readable_id"] == course_data["Course_Id"]
    assert transformed["runs"] == [
        transform_run(run, course_data) for run in course_runs_data
    ]
    assert transformed["learning_format"] == list(
        {transform_format(run["Delivery"])[0] for run in course_runs_data}
    )
    assert transformed["image"] == parse_image(course_data)
    assert transformed["availability"] == parse_availability(course_runs_data)
    assert sorted(transformed.keys()) == sorted(
        [
            "readable_id",
            "title",
            "offered_by",
            "platform",
            "etl_source",
            "description",
            "url",
            "image",
            "certification",
            "certification_type",
            "professional",
            "published",
            "learning_format",
            "topics",
            "course",
            "runs",
            "availability",
        ]
    )


def test_parse_image(mock_sloan_courses_data, mock_sloan_runs_data):
    course_data = mock_sloan_courses_data[0]
    runs_data = mock_sloan_runs_data[0:10]

    transformed = transform_course(course_data, runs_data)

    assert transformed["image"] == {
        "url": course_data.get("Image_Src"),
        "alt": course_data.get("Title"),
        "description": course_data.get("Title"),
    }


def test_parse_topics(mock_sloan_courses_data, mock_sloan_runs_data):
    course_data = mock_sloan_courses_data[0]
    offeror = LearningResourceOfferorFactory.create(name="see", code="see")
    topic_mappings = LearningResourceTopicMappingFactory.create_batch(
        3, offeror=offeror
    )
    runs_data = mock_sloan_runs_data[0:10]
    for topic_map in topic_mappings:
        course_data["Topics"] = f"test:{topic_map.topic.name}"
        transformed = transform_course(course_data, runs_data)
        assert transformed["topics"] == [{"name": topic_map.topic.name}]


@pytest.mark.parametrize(
    ("delivery", "run_format", "availability"),
    [
        ("Online", "Synchronous", Availability.dated.name),
        ("Online", "Asynchronous (On-Demand)", Availability.anytime.name),
        ("Online", "Asynchronous (Date based)", Availability.dated.name),
        ("In Person", "Asynchronous (On-Demand)", Availability.dated.name),
    ],
)
def test_parse_availability(delivery, run_format, availability):
    runs_data = [
        {
            "Format": run_format,
            "Delivery": delivery,
        }
    ]
    assert parse_availability(runs_data) == [availability]
    assert parse_availability([]) == [Availability.dated.name]
    runs_data.append({"Format": "Online", "Delivery": Availability.dated.name})
    assert parse_availability(runs_data) == list(
        set(availability, Availability.dated.name)
    )


def test_enabled_flag(mock_sloan_api_setting, settings):
    """Extract should return empty lists if the SEE_API_ENABLED flag is False"""
    settings.SEE_API_ENABLED = False
    assert extract() == ([], [])
