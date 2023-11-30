"""
Test learning_resources utils
"""

import json
from datetime import datetime
from pathlib import Path

import pytest
import pytz

from learning_resources.constants import (
    CONTENT_TYPE_FILE,
    CONTENT_TYPE_PDF,
    CONTENT_TYPE_VIDEO,
)
from learning_resources.etl.utils import get_content_type
from learning_resources.models import LearningResourcePlatform
from learning_resources.utils import (
    get_ocw_topics,
    load_course_blocklist,
    load_course_duplicates,
    parse_instructors,
    safe_load_json,
    semester_year_to_date,
    upsert_platform_data,
)


@pytest.fixture(name="test_instructors_data")
def fixture_test_instructors_data():
    """
    Test instructors data
    """
    with open("./test_json/test_instructors_data.json") as test_data:  # noqa: PTH123
        return json.load(test_data)["instructors"]


@pytest.mark.parametrize(
    ("semester", "year", "ending", "expected"),
    [
        ("spring", 2020, True, "2020-05-31"),
        ("spring", 2020, False, "2020-01-01"),
        ("fall", 2020, True, "2020-12-31"),
        ("fall", 2020, False, "2020-09-01"),
        ("summer", 2021, True, "2021-08-30"),
        ("summer", 2021, False, "2021-06-01"),
        ("spring", None, False, None),
        (None, 2020, False, None),
        ("something", 2020, False, None),
        ("something", 2020, True, None),
        ("January IAP", 2018, False, "2018-01-01"),
        ("January IAP", 2018, True, "2018-01-31"),
    ],
)
def test_semester_year_to_date(semester, year, ending, expected):
    """
    Test that a correct rough date is returned for semester and year
    """
    if expected is None:
        assert semester_year_to_date(semester, year, ending=ending) is None
    else:
        assert semester_year_to_date(
            semester, year, ending=ending
        ) == datetime.strptime(expected, "%Y-%m-%d").replace(tzinfo=pytz.UTC)


@pytest.mark.parametrize("url", [None, "http://test.me"])
def test_load_blocklist(url, settings, mocker):
    """Test that a list of course ids is returned if a URL is set"""
    settings.BLOCKLISTED_COURSES_URL = url
    file_content = [b"MITX_Test1_FAKE", b"MITX_Test2_Fake", b"OCW_Test_Fake"]
    mock_request = mocker.patch(
        "requests.get",
        autospec=True,
        return_value=mocker.Mock(iter_lines=mocker.Mock(return_value=file_content)),
    )
    blocklist = load_course_blocklist()
    if url is None:
        mock_request.assert_not_called()
        assert blocklist == []
    else:
        mock_request.assert_called_once_with(url, timeout=settings.REQUESTS_TIMEOUT)
        assert blocklist == [str(id, "utf-8") for id in file_content]  # noqa: A001


@pytest.mark.parametrize("url", [None, "http://test.me"])
@pytest.mark.parametrize("etl_source", ["mitx", "other"])
def test_load_course_duplicates(url, etl_source, settings, mocker):
    """Test that a list of duplicate course id sets is returned if a URL is set"""
    settings.DUPLICATE_COURSES_URL = url
    file_content = """
---
mitx:
  - duplicate_course_ids:
      - MITx+1
      - MITx+2
      - MITx+3
    course_id: MITx+1
"""

    mock_request = mocker.patch(
        "requests.get", autospec=True, return_value=mocker.Mock(text=file_content)
    )
    duplicates = load_course_duplicates(etl_source)
    if url is None:
        mock_request.assert_not_called()
        assert duplicates == []
    elif etl_source == "other":
        mock_request.assert_called_once_with(url, timeout=settings.REQUESTS_TIMEOUT)
        assert duplicates == []
    else:
        mock_request.assert_called_once_with(url, timeout=settings.REQUESTS_TIMEOUT)
        assert duplicates == [
            {
                "duplicate_course_ids": ["MITx+1", "MITx+2", "MITx+3"],
                "course_id": "MITx+1",
            }
        ]


def test_safe_load_bad_json(mocker):
    """Test that safe_load_json returns an empty dict for invalid JSON"""
    mock_logger = mocker.patch("learning_resources.utils.log.exception")
    assert safe_load_json("badjson", "key") == {}
    mock_logger.assert_called_with("%s has a corrupted JSON", "key")


def test_parse_instructors(test_instructors_data):
    """
    Verify that instructors assignment is working as expected
    """
    for instructor in test_instructors_data:
        parsed_instructors = parse_instructors([instructor["data"]])
        parsed_instructor = parsed_instructors[0]
        assert parsed_instructor.get("first_name") == instructor["result"]["first_name"]
        assert parsed_instructor.get("last_name") == instructor["result"]["last_name"]
        assert parsed_instructor.get("full_name") == instructor["result"]["full_name"]


def test_get_ocw_topics():
    """get_ocw_topics should return the expected list of topics"""
    collection = [
        {
            "ocw_feature": "Engineering",
            "ocw_subfeature": "Mechanical Engineering",
            "ocw_speciality": "Dynamics and Control",
        },
        {
            "ocw_feature": "Engineering",
            "ocw_subfeature": "Electrical Engineering",
            "ocw_speciality": "Signal Processing",
        },
    ]

    assert sorted(get_ocw_topics(collection)) == [
        "Dynamics and Control",
        "Electrical Engineering",
        "Engineering",
        "Mechanical Engineering",
        "Signal Processing",
    ]


@pytest.mark.parametrize(
    ("file_type", "output"),
    [
        ("video/mp4", CONTENT_TYPE_VIDEO),
        ("application/pdf", CONTENT_TYPE_PDF),
        ("application/zip", CONTENT_TYPE_FILE),
        (None, CONTENT_TYPE_FILE),
    ],
)
def test_get_content_type(file_type, output):
    """
    get_content_type should return expected value
    """
    assert get_content_type(file_type) == output


@pytest.mark.django_db()
def test_platform_data():
    """
    Test that the platform data is upserted correctly
    """
    LearningResourcePlatform.objects.create(code="bad", name="bad platform")
    assert LearningResourcePlatform.objects.filter(code="bad").count() == 1
    with Path.open(Path(__file__).parent / "fixtures" / "platforms.json") as inf:
        expected_count = len(json.load(inf))
    upsert_platform_data()
    assert LearningResourcePlatform.objects.count() == expected_count
    assert LearningResourcePlatform.objects.filter(code="bad").exists() is False
