"""Tests for MicroMasters ETL functions"""
# pylint: disable=redefined-outer-name
import pytest

from learning_resources.constants import LearningResourceType, PlatformType
from learning_resources.etl import micromasters
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.micromasters import READABLE_ID_PREFIX
from learning_resources.factories import LearningResourceFactory


@pytest.fixture()
def mock_micromasters_data():
    """Mock micromasters data"""
    return [
        {
            "id": 1,
            "title": "program title 1",
            "programpage_url": "http://example.com/program/1/url",
            "thumbnail_url": "http://example.com/program/1/image/url",
            "extra_field": "value",
            "courses": [
                {
                    "edx_key": "2",
                    "position_in_program": 2,
                    "extra_field": "value",
                    "course_runs": [{"edx_course_key": None}, {"edx_course_key": ""}],
                },
                {
                    "edx_key": "1",
                    "position_in_program": 1,
                    "extra_field": "value",
                    "course_runs": [{"edx_course_key": "course_key_1"}],
                },
            ],
            "instructors": [
                {"name": "Dr. Doofenshmirtz"},
                {"name": "Joey Jo Jo Shabadoo"},
            ],
            "topics": [{"name": "program"}, {"name": "first"}],
            "total_price": "123.45",
            "start_date": "2019-10-04T20:13:26.367297Z",
            "end_date": None,
            "enrollment_start": "2019-09-29T20:13:26.367297Z",
        },
        {
            "id": 2,
            "title": "program title 2",
            "programpage_url": "http://example.com/dedp/program/2/url",
            "thumbnail_url": "http://example.com/program/2/image/url",
            "extra_field": "value",
            "courses": [
                {
                    "edx_key": "3",
                    "position_in_program": 1,
                    "extra_field": "value",
                    "course_runs": [],
                },
                {
                    "edx_key": "4",
                    "position_in_program": 2,
                    "extra_field": "value",
                    "course_runs": [{"edx_course_key": "course_key_4"}],
                },
            ],
            "instructors": [{"name": "Mia"}, {"name": "Leah"}],
            "topics": [{"name": "program"}, {"name": "second"}],
            "start_date": None,
            "end_date": "2019-10-04T20:14:50.271027Z",
            "enrollment_start": None,
            "total_price": "87.65",
        },
    ]


@pytest.fixture()
def mocked_catalog_responses(mocked_responses, settings, mock_micromasters_data):
    """Mock the catalog response"""
    settings.MICROMASTERS_CATALOG_API_URL = "http://localhost/test/catalog/api"
    mocked_responses.add(
        mocked_responses.GET,
        settings.MICROMASTERS_CATALOG_API_URL,
        json=mock_micromasters_data,
    )
    return mocked_responses


@pytest.mark.usefixtures("mocked_catalog_responses")
def test_micromasters_extract(mock_micromasters_data):
    """Verify that the extraction function calls the micromasters catalog API and returns the responses"""
    assert micromasters.extract() == mock_micromasters_data


def test_micromasters_extract_disabled(settings):
    """Verify an empty list is returned if the API URL isn't set"""
    settings.MICROMASTERS_CATALOG_API_URL = None
    assert micromasters.extract() == []


@pytest.mark.django_db()
def test_micromasters_transform(mock_micromasters_data):
    """Test that micromasters data is correctly transformed into our normalized structure"""
    LearningResourceFactory.create(
        readable_id="1",
        resource_type=LearningResourceType.course.value,
        etl_source=ETLSource.mit_edx.value,
    )
    assert micromasters.transform(mock_micromasters_data) == [
        {
            "readable_id": f"{READABLE_ID_PREFIX}1",
            "title": "program title 1",
            "url": "http://example.com/program/1/url",
            "image": {"url": "http://example.com/program/1/image/url"},
            "offered_by": micromasters.OFFERED_BY,
            "platform": PlatformType.edx.value,
            "etl_source": ETLSource.micromasters.value,
            "courses": [
                {
                    "readable_id": "1",
                    "platform": PlatformType.edx.value,
                    "offered_by": micromasters.OFFERED_BY,
                    "published": True,
                    "runs": [
                        {
                            "run_id": "course_key_1",
                        }
                    ],
                },
                {
                    "readable_id": "2",
                    "platform": PlatformType.edx.value,
                    "offered_by": micromasters.OFFERED_BY,
                    "published": False,
                    "runs": [],
                },
            ],
            "runs": [
                {
                    "run_id": 1,
                    "title": "program title 1",
                    "instructors": [
                        {"full_name": "Dr. Doofenshmirtz"},
                        {"full_name": "Joey Jo Jo Shabadoo"},
                    ],
                    "prices": ["123.45"],
                    "start_date": "2019-10-04T20:13:26.367297Z",
                    "end_date": None,
                    "enrollment_start": "2019-09-29T20:13:26.367297Z",
                }
            ],
            "topics": [{"name": "program"}, {"name": "first"}],
        },
        {
            "readable_id": f"{READABLE_ID_PREFIX}2",
            "title": "program title 2",
            "url": "http://example.com/dedp/program/2/url",
            "image": {"url": "http://example.com/program/2/image/url"},
            "offered_by": micromasters.OFFERED_BY,
            "platform": PlatformType.mitxonline.value,
            "etl_source": ETLSource.micromasters.value,
            "courses": [
                {
                    "readable_id": "course-v1:3",
                    "platform": PlatformType.mitxonline.value,
                    "offered_by": micromasters.OFFERED_BY,
                    "runs": [],
                    "published": False,
                },
                {
                    "readable_id": "course-v1:4",
                    "platform": PlatformType.mitxonline.value,
                    "offered_by": micromasters.OFFERED_BY,
                    "runs": [{"run_id": "course_key_4"}],
                    "published": False,
                },
            ],
            "runs": [
                {
                    "run_id": 2,
                    "title": "program title 2",
                    "instructors": [{"full_name": "Mia"}, {"full_name": "Leah"}],
                    "prices": ["87.65"],
                    "start_date": None,
                    "end_date": "2019-10-04T20:14:50.271027Z",
                    "enrollment_start": None,
                }
            ],
            "topics": [{"name": "program"}, {"name": "second"}],
        },
    ]
