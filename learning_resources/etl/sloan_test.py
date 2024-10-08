"""Tests for prolearn etl functions"""

import json
from urllib.parse import urljoin

import pytest

from learning_resources.constants import (
    Availability,
    Format,
    Pace,
    RunStatus,
)
from learning_resources.etl.sloan import (
    extract,
    parse_availability,
    parse_datetime,
    parse_format,
    parse_image,
    parse_location,
    parse_pace,
    transform_course,
    transform_delivery,
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


@pytest.fixture
def mock_sloan_courses_data():
    """Mock prolearn MIT Professional Education courses data"""
    with open("./test_json/test_sloan_courses.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture
def mock_sloan_runs_data():
    """Mock prolearn MIT Professional Education courses data"""
    with open("./test_json/test_sloan_runs.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture
def mocked_sloan_auth_token_response(
    mocked_responses, settings, mock_sloan_runs_data, mock_sloan_api_setting
):
    mocked_responses.add(
        mocked_responses.POST,
        settings.SEE_API_ACCESS_TOKEN_URL,
        json={"access_token": "test"},
    )
    return mocked_responses


@pytest.fixture
def mocked_sloan_course_runs_responses(
    mocked_responses, settings, mock_sloan_runs_data, mock_sloan_api_setting
):
    mocked_responses.add(
        mocked_responses.GET,
        urljoin(settings.SEE_API_URL, "course-offerings"),
        json=mock_sloan_runs_data,
    )
    return mocked_responses


@pytest.fixture
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
        "status": RunStatus.current.value,
        "delivery": transform_delivery(run_data["Delivery"]),
        "availability": parse_availability(run_data),
        "published": True,
        "prices": [run_data["Price"]],
        "instructors": [{"full_name": name.strip()} for name in faculty_names],
        "pace": [Pace.instructor_paced.name],
        "format": [Format.synchronous.name],
        "location": run_data["Location"],
    }


def test_transform_course(mock_sloan_courses_data, mock_sloan_runs_data):
    course_data = mock_sloan_courses_data[0]
    course_runs_data = [
        run
        for run in mock_sloan_runs_data
        if run["Course_Id"] == course_data["Course_Id"]
    ]

    transformed = transform_course(course_data, mock_sloan_runs_data)

    assert transformed["readable_id"] == course_data["Course_Id"]
    assert transformed["runs"] == [
        transform_run(run, course_data) for run in course_runs_data
    ]
    assert transformed["delivery"] == list(
        {transform_delivery(run["Delivery"])[0] for run in course_runs_data}
    )
    assert transformed["runs"][0]["availability"] == parse_availability(
        course_runs_data[0]
    )
    assert transformed["pace"] == [Pace.instructor_paced.name]
    assert transformed["format"] == [Format.asynchronous.name, Format.synchronous.name]
    assert transformed["runs"][0]["pace"] == [Pace.instructor_paced.name]
    assert transformed["runs"][0]["format"] == [Format.asynchronous.name]
    assert transformed["image"] == parse_image(course_data)
    assert (
        transformed["continuing_ed_credits"]
        == course_runs_data[0]["Continuing_Ed_Credits"]
    )
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
            "delivery",
            "topics",
            "course",
            "runs",
            "continuing_ed_credits",
            "pace",
            "format",
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
    run_data = {
        "Format": run_format,
        "Delivery": delivery,
    }
    assert parse_availability(run_data) == availability
    assert parse_availability(None) == Availability.dated.name


def test_enabled_flag(mock_sloan_api_setting, settings):
    """Extract should return empty lists if the SEE_API_ENABLED flag is False"""
    settings.SEE_API_ENABLED = False
    assert extract() == ([], [])


@pytest.mark.parametrize(
    ("delivery", "run_format", "pace"),
    [
        ("Online", "Synchronous", Pace.instructor_paced.name),
        ("Online", "Asynchronous (On-Demand)", Pace.self_paced.name),
        ("Online", "Asynchronous (Date based)", Pace.instructor_paced.name),
        ("In Person", "Asynchronous (On-Demand)", Pace.instructor_paced.name),
    ],
)
def test_parse_pace(delivery, run_format, pace):
    """Test that the pace is parsed correctly"""
    run_data = {
        "Format": run_format,
        "Delivery": delivery,
    }
    assert parse_pace(run_data) == pace
    assert parse_pace(None) == Pace.instructor_paced.name


@pytest.mark.parametrize(
    ("delivery", "run_format", "expected_format"),
    [
        ("In Person", "Asynchronous (On-Demand)", [Format.synchronous.name]),
        (
            "Blended",
            "Asynchronous (On-Demand)",
            [Format.synchronous.name, Format.asynchronous.name],
        ),
        ("Online", "Synchronous", [Format.synchronous.name]),
        ("Online", "Asynchronous (On-Demand)", [Format.asynchronous.name]),
        ("Online", "Asynchronous (Date based)", [Format.asynchronous.name]),
        ("Online", None, [Format.synchronous.name]),
        (None, None, [Format.synchronous.name]),
    ],
)
def test_parse_format(delivery, run_format, expected_format):
    """Test that the format is parsed correctly"""
    run_data = {
        "Format": run_format,
        "Delivery": delivery,
    }
    assert parse_format(run_data) == expected_format
    assert parse_format(None) == [Format.asynchronous.name]


@pytest.mark.parametrize(
    ("delivery", "location", "result"),
    [
        ("Online", "Online", ""),
        ("In Person", "Cambridge, MA", "Cambridge, MA"),
        ("Blended", "Boston, MA", "Boston, MA"),
        ("Online", None, ""),
    ],
)
def test_parse_location(delivery, location, result):
    """Test that the location is parsed correctly"""
    run_data = {
        "Delivery": delivery,
        "Location": location,
    }
    assert parse_location(run_data) == result
    assert parse_location(None) == ""
