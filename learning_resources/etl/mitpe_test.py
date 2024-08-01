"""Tests for Professional Education ETL functions"""

import datetime
import json
from pathlib import Path
from random import randint

import pytest

from learning_resources.constants import LearningResourceFormat
from learning_resources.etl import mitpe
from main.test_utils import any_instance_of, assert_json_equal
from main.utils import now_in_utc

EXPECTED_COURSE = {
    "readable_id": "6d8f9727-beb3-4def-bfb6-bc0f7e270d58",
    "offered_by": {"code": "mitpe"},
    "platform": "mitpe",
    "etl_source": "mitpe",
    "professional": True,
    "certification": True,
    "certification_type": "professional",
    "title": "Product Innovation in the Age of AI",
    "url": "https://professional.mit.edu/course-catalog/product-innovation-age-ai",
    "image": {
        "alt": "product innovation in the age of AI",
        "description": "",
        "url": "https://professional.mit.edu/sites/default/files/2024-04/MITPE-ProductInnovationAgeOfAI-website-banner-1600x800.jpg",
    },
    "description": "The featured course summary.",
    "full_description": "The full course description.",
    "course": {"course_numbers": []},
    "learning_format": ["in_person"],
    "published": True,
    "topics": [{"name": "Innovation"}],
    "runs": [
        {
            "run_id": "6d8f9727-beb3-4def-bfb6-bc0f7e270d58_69fccd43e465859229fe22dc61f54b9a",
            "title": "Product Innovation in the Age of AI",
            "start_date": any_instance_of(datetime.datetime),
            "end_date": any_instance_of(datetime.datetime),
            "enrollment_end": any_instance_of(datetime.datetime),
            "published": True,
            "prices": [3600],
            "url": "https://professional.mit.edu/course-catalog/product-innovation-age-ai",
            "instructors": [
                {
                    "full_name": "Eric von Hippel",
                    "last_name": "von Hippel",
                    "first_name": "Eric",
                },
                {
                    "full_name": "Erdin Beshimov",
                    "last_name": " Beshimov",
                    "first_name": "Erdin",
                },
            ],
        }
    ],
    "unique_field": "url",
}
EXPECTED_PROGRAM = {
    "readable_id": "9c0692c9-7216-4be1-b432-fbeefec1da1f",
    "offered_by": {"code": "mitpe"},
    "platform": "mitpe",
    "etl_source": "mitpe",
    "professional": True,
    "certification": True,
    "certification_type": "professional",
    "title": "Professional Certificate Program in Innovation & Technology",
    "url": "https://professional.mit.edu/course-catalog/professional-certificate-program-innovation-technology",
    "image": {
        "alt": "Innovation & Technology - Header Image",
        "description": "",
        "url": "https://professional.mit.edu/sites/default/files/2021-01/MITPE-InnovationCertificateProgram-website-banner-1600x800.jpg",
    },
    "description": "The featured program summary.",
    "full_description": "The full program description.",
    "learning_format": ["hybrid"],
    "published": True,
    "topics": [{"name": "Innovation"}],
    "runs": [
        {
            "run_id": "9c0692c9-7216-4be1-b432-fbeefec1da1f_5e5dcf98bcd8e20096b79a761de23dc6",
            "title": "Professional Certificate Program in Innovation & Technology",
            "start_date": any_instance_of(datetime.datetime),
            "end_date": any_instance_of(datetime.datetime),
            "enrollment_end": any_instance_of(datetime.datetime),
            "published": True,
            "prices": [28000],
            "url": "https://professional.mit.edu/course-catalog/professional-certificate-program-innovation-technology",
            "instructors": [
                {
                    "full_name": "Blade Kotelly",
                    "last_name": "Kotelly",
                    "first_name": "Blade",
                },
                {
                    "full_name": "Reza Rahaman",
                    "last_name": "Rahaman",
                    "first_name": "Reza",
                },
                {
                    "full_name": "Michael Davies",
                    "last_name": "Davies",
                    "first_name": "Michael",
                },
                {
                    "full_name": "Sang-Gook Kim",
                    "last_name": "Kim",
                    "first_name": "Sang-Gook",
                },
                {
                    "full_name": "Eric von Hippel",
                    "last_name": "von Hippel",
                    "first_name": "Eric",
                },
                {
                    "full_name": "Erdin Beshimov",
                    "last_name": " Beshimov",
                    "first_name": "Erdin",
                },
                {
                    "full_name": "Adam Berinsky",
                    "last_name": "Berinsky",
                    "first_name": "Adam",
                },
                {"full_name": "David Niño", "last_name": "Niño", "first_name": "David"},
                {
                    "full_name": "Markus J. Buehler",
                    "last_name": "Buehler",
                    "first_name": "Markus J.",
                },
                {
                    "full_name": "Edward Schiappa",
                    "last_name": "Schiappa",
                    "first_name": "Edward",
                },
                {"full_name": "John Hart", "last_name": "Hart", "first_name": "John"},
            ],
        }
    ],
    "courses": [EXPECTED_COURSE],
    "unique_field": "url",
}


@pytest.fixture()
def prof_ed_settings(settings):
    """Fixture to set Professional Education API URL"""
    settings.PROFESSIONAL_EDUCATION_API_URL = "http://pro_edu_api.com"
    return settings


@pytest.fixture()
def mock_fetch_data(mocker):
    """Mock fetch_data function"""

    def read_json(file_path):
        with Path.open(file_path, "r") as file:
            return mocker.Mock(json=mocker.Mock(return_value=json.load(file)))

    return mocker.patch(
        "learning_resources.etl.mitpe.requests.get",
        side_effect=[
            read_json("./test_json/professional_ed/professional_ed_resources.json"),
            read_json(
                "./test_json/professional_ed/professional_ed_program_instructors.json"
            ),
            read_json(
                "./test_json/professional_ed/professional_ed_program_image_1.json"
            ),
            read_json(
                "./test_json/professional_ed/professional_ed_program_image_2.json"
            ),
            read_json(
                "./test_json/professional_ed/professional_ed_program_topics.json"
            ),
            read_json(
                "./test_json/professional_ed/professional_ed_course_instructors.json"
            ),
            read_json(
                "./test_json/professional_ed/professional_ed_course_image_1.json"
            ),
            read_json(
                "./test_json/professional_ed/professional_ed_course_image_2.json"
            ),
            read_json("./test_json/professional_ed/professional_ed_course_topics.json"),
        ],
    )


@pytest.mark.parametrize("prof_ed_api_url", ["http://pro_edd_api.com", None])
def test_extract(settings, mock_fetch_data, prof_ed_api_url):
    """Test extract function"""
    settings.PROFESSIONAL_EDUCATION_API_URL = prof_ed_api_url
    with Path.open(
        Path("./test_json/professional_ed/professional_ed_resources.json"), "r"
    ) as file:
        expected = json.load(file)["data"]
    results = mitpe.extract()
    if prof_ed_api_url:
        assert len(results) == 2
        assert_json_equal(results, expected)
    else:
        assert len(results) == 0


def test_transform(mocker, mock_fetch_data, prof_ed_settings):
    """Test transform function, and effectivelu most other functions"""
    mocker.patch(
        "learning_resources.etl.mitpe.parse_date",
        return_value=now_in_utc() + datetime.timedelta(days=randint(5, 10)),  # noqa: S311
    )
    courses, programs = mitpe.transform(mitpe.extract())
    assert courses == [EXPECTED_COURSE]
    assert programs == [EXPECTED_PROGRAM]


@pytest.mark.parametrize(
    ("format_str", "expected"),
    [
        ("On Campus", [LearningResourceFormat.in_person.name]),
        ("Online", [LearningResourceFormat.online.name]),
        (
            "Live Virtual OR On Campus",
            [LearningResourceFormat.online.name, LearningResourceFormat.in_person.name],
        ),
        (
            "Live Virtual And On Campus",
            [LearningResourceFormat.hybrid.name],
        ),
        ("Unrecognized", [LearningResourceFormat.online.name]),
    ],
)
def test_parse_format(format_str, expected):
    """Test parse_format function"""
    assert sorted(mitpe.parse_format(format_str)) == sorted(expected)


@pytest.mark.parametrize(
    ("enrollment_end", "end_date", "published_count"),
    [
        (None, None, 1),
        (None, "2020-01-01", 0),
        ("2020-01-01", None, 0),
        ("2020-01-01", "2120-01-01", 0),
        ("2120-01-01", None, 1),
        ("2120-01-01", "2020-01-01", 0),
    ],
)
def test_transform_by_dates(
    mock_fetch_data, prof_ed_settings, enrollment_end, end_date, published_count
):
    """Transform should unpublish resources with past enrollment_end or end_dates"""
    resource_data = mitpe.extract()
    course_data = resource_data[1]
    course_data["attributes"]["field_registration_deadline"] = enrollment_end
    course_data["attributes"]["field_course_dates"][0]["end_value"] = end_date
    courses = mitpe.transform([course_data])[0]
    assert len(courses) == published_count
