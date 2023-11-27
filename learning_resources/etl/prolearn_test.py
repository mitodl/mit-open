"""Tests for prolearn etl functions"""

import json
from datetime import datetime
from decimal import Decimal

import pytest
import pytz

from learning_resources.etl import prolearn
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.prolearn import (
    get_offered_by,
    parse_date,
    parse_image,
    parse_price,
    parse_topic,
)
from learning_resources.factories import (
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
)
from learning_resources.models import LearningResourceOfferor

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _mock_offerors_platforms():
    """Make sure necessary platforms and offerors exist"""
    LearningResourceOfferorFactory.create(name="CSAIL", code="csail", professional=True)
    LearningResourcePlatformFactory.create(code="csail")
    LearningResourceOfferorFactory.create(
        name="Professional Education", code="mitpe", professional=True
    )
    LearningResourcePlatformFactory.create(code="mitpe")
    LearningResourceOfferorFactory.create(
        name="Center for Transportation & Logistics", code="ctl", professional=True
    )


@pytest.fixture(autouse=True)
def mock_prolearn_api_setting(settings):  # noqa: PT004
    """Set the prolearn api url"""
    settings.PROLEARN_CATALOG_API_URL = "http://localhost/test/programs/api"


@pytest.fixture()
def mock_csail_programs_data():
    """Mock prolearn CSAIL programs data"""
    with open("./test_json/prolearn_csail_programs.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mock_mitpe_courses_data():
    """Mock prolearn Professional Education courses data"""
    with open("./test_json/prolearn_mitpe_courses.json") as f:  # noqa: PTH123
        return json.loads(f.read())


@pytest.fixture()
def mocked_prolearn_programs_responses(
    mocked_responses, settings, mock_csail_programs_data
):
    """Mock the programs api response"""
    settings.PROLEARN_CATALOG_API_URL = "http://localhost/test/programs/api"
    mocked_responses.add(
        mocked_responses.POST,
        settings.PROLEARN_CATALOG_API_URL,
        json=mock_csail_programs_data,
    )
    return mocked_responses


@pytest.fixture()
def mocked_prolearn_courses_responses(
    mocked_responses, settings, mock_mitpe_courses_data
):
    """Mock the courses api response"""
    settings.PROLEARN_CATALOG_API_URL = "http://localhost/test/courses/api"
    mocked_responses.add(
        mocked_responses.POST,
        settings.PROLEARN_CATALOG_API_URL,
        json=mock_mitpe_courses_data,
    )
    return mocked_responses


@pytest.mark.usefixtures("mocked_prolearn_programs_responses")
def test_prolearn_extract_programs(mock_csail_programs_data):
    """Verify that the extraction function calls the prolearn programs API and returns the responses"""
    assert (
        prolearn.extract_programs()
        == mock_csail_programs_data["data"]["searchAPISearch"]["documents"]
    )


def test_prolearn_extract_programs_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.PROLEARN_CATALOG_API_URL = None
    assert prolearn.extract_programs() == []


@pytest.mark.usefixtures("mocked_prolearn_courses_responses")
def test_prolearn_extract_courses(mock_mitpe_courses_data):
    """Verify that the extraction function calls the prolearn courses API and returns the responses"""
    assert (
        prolearn.extract_courses()
        == mock_mitpe_courses_data["data"]["searchAPISearch"]["documents"]
    )


def test_prolearn_extract_courses_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.PROLEARN_CATALOG_API_URL = None
    assert prolearn.extract_courses() == []


def test_prolearn_transform_programs(mock_csail_programs_data):
    """Test that prolearn program data is correctly transformed into our normalized structure"""
    extracted_data = mock_csail_programs_data["data"]["searchAPISearch"]["documents"]
    result = prolearn.transform_programs(extracted_data)
    expected = [
        {
            "readable_id": program["nid"],
            "title": program["title"],
            "url": (
                program["course_link"]
                or program["course_application_url"]
                or program["url"]
            ),
            "image": parse_image(program),
            "platform": "csail",
            "offered_by": {"name": "CSAIL"},
            "etl_source": ETLSource.prolearn.name,
            "professional": True,
            "runs": [
                {
                    "run_id": f"{program['nid']}_{start_val}",
                    "title": program["title"],
                    "prices": parse_price(program),
                    "start_date": parse_date(start_val),
                    "end_date": parse_date(end_val),
                }
                for (start_val, end_val) in zip(
                    program["start_value"], program["end_value"]
                )
            ],
            "topics": parse_topic(program),
            # all we need for course data is the relative positioning of courses by course_id
            "courses": [
                {
                    "readable_id": course_id,
                    "platform": "csail",
                    "offered_by": {"name": "CSAIL"},
                    "professional": True,
                    "etl_source": ETLSource.prolearn.name,
                    "runs": [
                        {
                            "run_id": course_id,
                        }
                    ],
                }
                for course_id in sorted(program["field_related_courses_programs"])
            ],
        }
        for program in extracted_data
    ]
    assert result == expected


def test_prolearn_transform_courses(mock_mitpe_courses_data):
    """Test that prolearn courses data is correctly transformed into our normalized structure"""
    extracted_data = mock_mitpe_courses_data["data"]["searchAPISearch"]["documents"]
    result = list(prolearn.transform_courses(extracted_data))
    expected = [
        {
            "readable_id": course["nid"],
            "platform": "mitpe",
            "offered_by": {"name": "Professional Education"},
            "etl_source": ETLSource.prolearn.name,
            "title": course["title"],
            "image": parse_image(course),
            "description": course["body"],
            "published": True,
            "professional": True,
            "topics": parse_topic(course),
            "url": (
                course["course_link"]
                or course["course_application_url"]
                or course["url"]
            ),
            "runs": [
                {
                    "run_id": f"{course['nid']}_{start_val}",
                    "title": course["title"],
                    "image": parse_image(course),
                    "description": course["body"],
                    "start_date": parse_date(start_val),
                    "end_date": parse_date(end_val),
                    "published": True,
                    "prices": parse_price(course),
                    "url": (
                        course["course_link"]
                        or course["course_application_url"]
                        or course["url"]
                    ),
                }
                for (start_val, end_val) in zip(
                    course["start_value"], course["end_value"]
                )
            ],
            "course": {"course_numbers": []},
        }
        for course in extracted_data
    ]
    assert expected == result


@pytest.mark.parametrize(
    ("date_int", "expected_dt"),
    [
        [1670932800, datetime(2022, 12, 13, 12, 0, tzinfo=pytz.UTC)],  # noqa: PT007
        [None, None],  # noqa: PT007
    ],
)
def test_parse_date(date_int, expected_dt):
    """Integer array should be parsed into correct datetimes"""
    assert parse_date(date_int) == expected_dt


@pytest.mark.parametrize(
    ("price_str", "price_list"),
    [
        ["$5,342", [round(Decimal(5342), 2)]],  # noqa: PT007
        ["5.34", [round(Decimal(5.34), 2)]],  # noqa: PT007
        [None, []],  # noqa: PT007
        ["", []],  # noqa: PT007
    ],
)
def test_parse_price(price_str, price_list):
    """Price string should be parsed into correct Decimal list"""
    document = {"field_price": price_str}
    assert parse_price(document) == price_list


@pytest.mark.parametrize(
    ("topic", "expected"),
    [
        ["Blockchain", "Computer Science"],  # noqa: PT007
        ["Systems Engineering", "Systems Engineering"],  # noqa: PT007
        ["Other Business", "Business"],  # noqa: PT007
        ["Other Technology", None],  # noqa: PT007
    ],
)
def test_parse_topic(topic, expected):
    """parse_topic should return the matching OCW topic"""
    document = {"ucc_name": topic}
    if expected:
        assert parse_topic(document)[0]["name"] == expected
    else:
        assert parse_topic(document) == []


@pytest.mark.parametrize(
    ("department", "offered_by"),
    [
        ("MIT CSAIL", "CSAIL"),
        (
            "MIT Center for Transportation & Logistics",
            "Center for Transportation & Logistics",
        ),
        ("MIT Other", None),
    ],
)
def test_offered_by(department, offered_by):
    """get_offered_by should return expected LearningResourceOfferor or None"""
    document = {"department": department}
    if offered_by:
        assert (
            get_offered_by(document).name
            == LearningResourceOfferor.objects.get(name=offered_by).name
        )
    else:
        assert get_offered_by(document) is None


@pytest.mark.parametrize(
    ("featured_image_url", "expected_url"),
    [
        ["/a/b/c.jog", "http://localhost/a/b/c.jog"],  # noqa: PT007
        ["", None],  # noqa: PT007
        [None, None],  # noqa: PT007
    ],
)
def test_parse_image(featured_image_url, expected_url):
    """parse_image should return the expected url"""
    document = {"featured_image_url": featured_image_url}
    assert parse_image(document) == ({"url": expected_url} if expected_url else None)
