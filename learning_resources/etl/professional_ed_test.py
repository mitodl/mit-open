"""Tests for Professional Education ETL functions"""

import json
from pathlib import Path

import pytest

from learning_resources.etl.professional_ed import extract
from main.test_utils import assert_json_equal


@pytest.fixture()
def mock_fetch_data(mocker):
    """Mock fetch_data function"""

    def read_json(file_path):
        with Path.open(file_path, "r") as file:
            return mocker.Mock(json=mocker.Mock(return_value=json.load(file)))

    return mocker.patch(
        "learning_resources.etl.professional_ed.requests.get",
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
    results = extract()
    if prof_ed_api_url:
        assert len(results) == 2
        assert_json_equal(results, expected)
    else:
        assert len(results) == 0
