"""Tests for prolearn etl functions"""

import json
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from urllib.parse import urljoin, urlparse

import pytest

from data_fixtures.utils import upsert_topic_data_file
from learning_resources.constants import (
    Availability,
    CertificationType,
    Format,
    LearningResourceDelivery,
    OfferedBy,
    Pace,
    PlatformType,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.prolearn import (
    MITPE_EXCLUSION,
    PROLEARN_BASE_URL,
    SEE_EXCLUSION,
    UNIQUE_FIELD,
    extract_courses,
    extract_data,
    extract_programs,
    parse_date,
    parse_image,
    parse_offered_by,
    parse_platform,
    parse_price,
    parse_topic,
    transform_courses,
    transform_programs,
    update_delivery,
)
from learning_resources.etl.utils import transform_delivery
from learning_resources.factories import (
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
)
from learning_resources.models import LearningResourceOfferor, LearningResourcePlatform
from main.test_utils import assert_json_equal
from main.utils import clean_data

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _mock_offerors_platforms():
    """Make sure necessary platforms and offerors exist"""
    LearningResourcePlatformFactory.create(code="csail")
    LearningResourceOfferorFactory.create(
        name="MIT Professional Education", code="mitpe", professional=True
    )
    LearningResourcePlatformFactory.create(
        code="mitpe", name="MIT Professional Education"
    )
    upsert_topic_data_file()


@pytest.fixture(autouse=True)
def mock_prolearn_api_setting(settings):
    """Set the prolearn api url"""
    settings.PROLEARN_CATALOG_API_URL = "http://localhost/test/programs/api"
    return settings


@pytest.fixture
def mock_csail_programs_data():
    """Mock prolearn CSAIL programs data"""
    with Path.open("./test_json/prolearn_csail_programs.json") as f:
        return json.loads(f.read())


@pytest.fixture
def mock_mitpe_courses_data():
    """Mock prolearn MIT Professional Education courses data"""
    with Path.open("./test_json/prolearn_mitpe_courses.json") as f:
        return json.loads(f.read())


@pytest.fixture
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


@pytest.fixture
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
        extract_programs()
        == mock_csail_programs_data["data"]["searchAPISearch"]["documents"]
    )


def test_prolearn_extract_programs_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.PROLEARN_CATALOG_API_URL = None
    assert extract_programs() == []


@pytest.mark.usefixtures("mocked_prolearn_courses_responses")
def test_prolearn_extract_courses(mock_mitpe_courses_data):
    """Verify that the extraction function calls the prolearn courses API and returns the responses"""
    assert (
        extract_courses()
        == mock_mitpe_courses_data["data"]["searchAPISearch"]["documents"]
    )


def test_prolearn_extract_courses_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.PROLEARN_CATALOG_API_URL = None
    assert extract_courses() == []


def test_prolearn_transform_programs(mock_csail_programs_data):
    """Test that prolearn program data is correctly transformed into our normalized structure"""
    extracted_data = mock_csail_programs_data["data"]["searchAPISearch"]["documents"]
    result = transform_programs(extracted_data)
    expected = [
        {
            "readable_id": f"prolearn-{PlatformType.csail.name}-{program['nid']}",
            "title": program["title"],
            "description": clean_data(program["body"]),
            "url": (
                program["course_link"]
                or program["course_application_url"]
                or urljoin(PROLEARN_BASE_URL, program["url"])
            ),
            "image": parse_image(program),
            "platform": PlatformType.csail.name,
            "offered_by": {"name": parse_offered_by(program).name}
            if parse_offered_by(program)
            else None,
            "etl_source": ETLSource.prolearn.name,
            "professional": True,
            "delivery": transform_delivery(program["format_name"]),
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "runs": [
                {
                    "run_id": f"{program['nid']}_{start_val}",
                    "title": program["title"],
                    "image": parse_image(program),
                    "description": clean_data(program["body"]),
                    "start_date": parse_date(start_val),
                    "end_date": parse_date(end_val),
                    "published": True,
                    "prices": parse_price(program),
                    "url": (
                        program["course_link"]
                        or program["course_application_url"]
                        or urljoin(PROLEARN_BASE_URL, program["url"])
                    ),
                    "availability": Availability.dated.name,
                    "delivery": transform_delivery(program["format_name"]),
                    "pace": [Pace.instructor_paced.name],
                    "format": [Format.asynchronous.name],
                }
                for (start_val, end_val) in zip(
                    program["start_value"], program["end_value"]
                )
            ],
            "topics": parse_topic(program, parse_offered_by(program))
            if parse_offered_by(program)
            else None,
            # all we need for course data is the relative positioning of courses by course_id
            "courses": [
                {
                    "readable_id": course_id,
                    "platform": "csail",
                    "offered_by": None,
                    "professional": True,
                    "certification": True,
                    "certification_type": CertificationType.professional.name,
                    "etl_source": ETLSource.prolearn.name,
                    "runs": [
                        {
                            "run_id": course_id,
                        }
                    ],
                    "unique_field": UNIQUE_FIELD,
                    "pace": [Pace.instructor_paced.name],
                    "format": [Format.asynchronous.name],
                }
                for course_id in sorted(program["field_related_courses_programs"])
            ],
            "unique_field": UNIQUE_FIELD,
            "pace": [Pace.instructor_paced.name],
            "format": [Format.asynchronous.name],
        }
        for program in extracted_data[1:]
    ]
    assert_json_equal(expected, result)


def test_prolearn_transform_courses(mock_mitpe_courses_data):
    """Test that prolearn courses data is correctly transformed into our normalized structure"""
    extracted_data = mock_mitpe_courses_data["data"]["searchAPISearch"]["documents"]
    result = list(transform_courses(extracted_data))
    expected = [
        {
            "readable_id": f"prolearn-{PlatformType.mitpe.name}-{course['nid']}",
            "platform": PlatformType.mitpe.name,
            "offered_by": {"name": OfferedBy.mitpe.value},
            "etl_source": ETLSource.prolearn.name,
            "title": course["title"],
            "image": parse_image(course),
            "description": clean_data(course["body"]),
            "published": True,
            "professional": True,
            "certification": True,
            "certification_type": CertificationType.professional.name,
            "delivery": transform_delivery(course["format_name"]),
            "topics": parse_topic(course, "mitpe"),
            "url": course["course_link"]
            if urlparse(course["course_link"]).path
            else (
                course["course_application_url"]
                or urljoin(PROLEARN_BASE_URL, course["url"])
            ),
            "availability": Availability.dated.name,
            "runs": [
                {
                    "run_id": f"{course['nid']}_{start_val}",
                    "title": course["title"],
                    "image": parse_image(course),
                    "description": clean_data(course["body"]),
                    "start_date": parse_date(start_val),
                    "end_date": parse_date(end_val),
                    "published": True,
                    "prices": parse_price(course),
                    "url": (
                        course["course_link"]
                        or course["course_application_url"]
                        or urljoin(PROLEARN_BASE_URL, course["url"])
                    ),
                    "availability": Availability.dated.name,
                    "delivery": transform_delivery(course["format_name"]),
                    "pace": [Pace.instructor_paced.name],
                    "format": [Format.asynchronous.name],
                }
                for (start_val, end_val) in zip(
                    course["start_value"], course["end_value"]
                )
            ],
            "course": {"course_numbers": []},
            "unique_field": UNIQUE_FIELD,
            "pace": [Pace.instructor_paced.name],
            "format": [Format.asynchronous.name],
        }
        for course in extracted_data[2:]
    ]
    assert_json_equal(expected, result)


@pytest.mark.parametrize(
    ("date_int", "expected_dt"),
    [
        (1670932800, datetime(2022, 12, 13, 12, 0, tzinfo=UTC)),
        (None, None),
    ],
)
def test_parse_date(date_int, expected_dt):
    """Integer array should be parsed into correct datetimes"""
    assert parse_date(date_int) == expected_dt


@pytest.mark.parametrize(
    ("price_str", "price_list"),
    [
        ("$5,342", [round(Decimal(5342), 2)]),
        ("5.34", [round(Decimal(5.34), 2)]),
        (None, []),
        ("", []),
    ],
)
def test_parse_price(price_str, price_list):
    """Price string should be parsed into correct Decimal list"""
    document = {"field_price": price_str}
    assert parse_price(document) == price_list


@pytest.mark.parametrize(
    ("topic", "expected"),
    [
        ("Blockchain", "Blockchain"),
        ("Systems Engineering", "Systems Engineering"),
        ("Other Business", "Management"),
        ("Other Technology", "Digital Business & IT"),
    ],
)
def test_parse_topic(topic, expected):
    """parse_topic should return the matching OCW topic"""

    document = {"ucc_name": topic}
    if expected:
        assert parse_topic(document, "mitpe")[0]["name"] == expected
    else:
        assert parse_topic(document, "mitpe") == []


@pytest.mark.parametrize(
    ("department", "offered_by"),
    [
        ("MIT Professional Education", "MIT Professional Education"),
        ("MIT Other", None),
    ],
)
def test_parse_offered_by(department, offered_by):
    """parse_offered_by should return expected LearningResourceOfferor or None"""
    document = {"department": department}
    if offered_by:
        assert (
            parse_offered_by(document).name
            == LearningResourceOfferor.objects.get(name=offered_by).name
        )
    else:
        assert parse_offered_by(document) is None


@pytest.mark.parametrize(
    ("department", "platform_name"),
    [
        ("MIT Professional Education", "MIT Professional Education"),
        ("MIT CSAIL", "CSAIL"),
        ("MIT Other", None),
    ],
)
def test_parse_platform(department, platform_name):
    """parse_platform should return expected platform code or None"""
    document = {"department": department}
    if platform_name:
        assert (
            parse_platform(document)
            == LearningResourcePlatform.objects.get(name=platform_name).code
        )
    else:
        assert parse_platform(document) is None


@pytest.mark.parametrize(
    ("featured_image_url", "expected_url"),
    [
        ("/a/b/c.jog", "http://localhost/a/b/c.jog"),
        ("", None),
        (None, None),
    ],
)
def test_parse_image(featured_image_url, expected_url):
    """parse_image should return the expected url"""
    document = {"featured_image_url": featured_image_url}
    assert parse_image(document) == ({"url": expected_url} if expected_url else None)


@pytest.mark.parametrize(
    ("old_delivery", "new_delivery", "expected_delivery"),
    [
        (
            [LearningResourceDelivery.online.name],
            [LearningResourceDelivery.online.name],
            [LearningResourceDelivery.online.name],
        ),
        (
            [LearningResourceDelivery.online.name],
            [LearningResourceDelivery.hybrid.name],
            [
                LearningResourceDelivery.online.name,
                LearningResourceDelivery.hybrid.name,
            ],
        ),
        (
            [
                LearningResourceDelivery.online.name,
                LearningResourceDelivery.in_person.name,
            ],
            [
                LearningResourceDelivery.hybrid.name,
                LearningResourceDelivery.offline.name,
            ],
            list(LearningResourceDelivery.names()),
        ),
    ],
)
def test_update_delivery(
    mock_mitpe_courses_data, old_delivery, new_delivery, expected_delivery
):
    """update_delivery should combine old delivery and new delivery appropriately"""
    first_course = transform_courses(
        mock_mitpe_courses_data["data"]["searchAPISearch"]["documents"]
    )[0]
    first_course["delivery"] = old_delivery
    update_delivery(first_course, new_delivery)
    assert first_course["delivery"] == sorted(expected_delivery)


@pytest.mark.parametrize("sloan_api_enabled", [True, False])
@pytest.mark.parametrize("mitpe_api_enabled", [True, False])
def test_sloan_exclusion(settings, mocker, sloan_api_enabled, mitpe_api_enabled):
    """Slaon/MITPE exclusion should be included if respective api enabled"""
    settings.SEE_API_ENABLED = sloan_api_enabled
    settings.MITPE_API_ENABLED = mitpe_api_enabled
    mock_post = mocker.patch("learning_resources.etl.prolearn.requests.post")
    extract_data("course")
    assert (
        SEE_EXCLUSION in mock_post.call_args[1]["json"]["query"]
    ) is sloan_api_enabled
    assert (
        MITPE_EXCLUSION in mock_post.call_args[1]["json"]["query"]
    ) is mitpe_api_enabled
