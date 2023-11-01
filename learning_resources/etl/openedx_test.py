"""OpenEdx ETL tests"""
# pylint: disable=redefined-outer-name
from datetime import datetime
from urllib.parse import urlencode

import pytest

from learning_resources.constants import LearningResourceType
from learning_resources.etl.constants import COMMON_HEADERS, CourseNumberType
from learning_resources.etl.openedx import (
    OpenEdxConfiguration,
    openedx_extract_transform_factory,
)
from open_discussions.test_utils import any_instance_of

ACCESS_TOKEN = "invalid_access_token"  # noqa: S105


@pytest.fixture()
def openedx_config():
    """Fixture for the openedx config object"""
    return OpenEdxConfiguration(
        "fake-client-id",
        "fake-client-secret",
        "http://localhost/fake-access-token-url/",
        "http://localhost/fake-api-url/",
        "http://localhost/fake-base-url/",
        "http://localhost/fake-alt-url/",
        "fake-platform-type",
        "fake-offered-by",
        "fake-etl-source",
    )


@pytest.fixture()
def openedx_extract_transform(openedx_config):
    """Fixture for generationg an extract/transform pair for the given config"""
    return openedx_extract_transform_factory(lambda: openedx_config)


def test_extract(mocked_responses, openedx_config, openedx_extract_transform):
    """Test the generated extract functoin walks the paginated results"""
    results1 = [1, 2, 3]
    results2 = [4, 5, 6]
    next_url = "http://localhost/next/url"

    mocked_responses.add(
        mocked_responses.POST,
        openedx_config.access_token_url,
        json={"access_token": ACCESS_TOKEN},
    )
    mocked_responses.add(
        mocked_responses.GET,
        openedx_config.api_url,
        json={"results": results1, "next": next_url},
    )
    mocked_responses.add(
        mocked_responses.GET, next_url, json={"results": results2, "next": None}
    )

    assert openedx_extract_transform.extract() == results1 + results2

    for call in mocked_responses.calls:
        # assert that headers contain our common ones
        assert set(COMMON_HEADERS.items()).issubset(set(call.request.headers.items()))

    assert mocked_responses.calls[0].request.body == urlencode(
        {
            "grant_type": "client_credentials",
            "client_id": openedx_config.client_id,
            "client_secret": openedx_config.client_secret,
            "token_type": "jwt",
        }
    )

    for call in mocked_responses.calls[1:]:
        assert ({("Authorization", f"JWT {ACCESS_TOKEN}")}).issubset(
            set(call.request.headers.items())
        )


@pytest.mark.usefixtures("mocked_responses")
@pytest.mark.parametrize("config_arg_idx", range(6))
def test_extract_disabled(openedx_config, config_arg_idx):
    """
    Verify that extract() exits with no API call if configuration is missing
    """

    args = list(openedx_config)
    args[config_arg_idx] = None

    config = OpenEdxConfiguration(*args)

    extract, _ = openedx_extract_transform_factory(lambda: config)

    assert extract() == []


@pytest.mark.parametrize("has_runs", [True, False])
@pytest.mark.parametrize("is_course_deleted", [True, False])
@pytest.mark.parametrize("is_course_run_deleted", [True, False])
def test_transform_course(  # noqa: PLR0913
    openedx_config,
    openedx_extract_transform,
    mitx_course_data,
    has_runs,
    is_course_deleted,
    is_course_run_deleted,
):  # pylint: disable=too-many-arguments
    """Test that the transform function normalizes and filters out data"""
    extracted = mitx_course_data["results"]
    for course in extracted:
        if not has_runs:
            course["course_runs"] = []
        if is_course_deleted:
            course["title"] = f"[delete] {course['title']}"
        if is_course_run_deleted:
            for run in course["course_runs"]:
                run["title"] = f"[delete] {run['title']}"
    transformed_courses = openedx_extract_transform.transform(extracted)
    if is_course_deleted or not has_runs:
        assert transformed_courses == []
    else:
        assert transformed_courses[0] == {
            "title": "The Analytics Edge",
            "readable_id": "MITx+15.071x",
            "resource_type": LearningResourceType.course.name,
            "departments": ["15"],
            "description": "short_description",
            "full_description": "full description",
            "platform": openedx_config.platform,
            "etl_source": openedx_config.etl_source,
            "offered_by": {"code": openedx_config.offered_by},
            "image": {
                "url": "https://prod-discovery.edx-cdn.org/media/course/image/ff1df27b-3c97-42ee-a9b3-e031ffd41a4f-747c9c2f216e.small.jpg",
                "description": "Image description",
            },
            "last_modified": any_instance_of(datetime),
            "topics": [{"name": "Data Analysis & Statistics"}],
            "url": "http://localhost/fake-alt-url/this_course",
            "published": True,
            "runs": []
            if is_course_run_deleted or not has_runs
            else [
                {
                    "availability": "Starting Soon",
                    "run_id": "course-v1:MITx+15.071x+1T2019",
                    "end_date": "2019-05-22T23:30:00Z",
                    "enrollment_end": None,
                    "enrollment_start": None,
                    "full_description": "<p>Full Description</p>",
                    "image": {
                        "url": "https://prod-discovery.edx-cdn.org/media/course/image/ff1df27b-3c97-42ee-a9b3-e031ffd41a4f-747c9c2f216e.small.jpg",
                        "description": None,
                    },
                    "instructors": [
                        {"first_name": "Dimitris", "last_name": "Bertsimas"},
                        {"first_name": "Allison", "last_name": "O'Hair"},
                    ],
                    "languages": ["en-us"],
                    "last_modified": any_instance_of(datetime),
                    "level": "Intermediate",
                    "prices": ["150.00", "0.00"],
                    "semester": "spring",
                    "description": "short_description",
                    "start_date": "2019-02-20T15:00:00Z",
                    "title": "The Analytics Edge",
                    "url": "http://localhost/fake-alt-url/this_course",
                    "year": 2019,
                    "published": True,
                }
            ],
            "course": {
                "course_numbers": [
                    {
                        "value": "MITx+15.071x",
                        "department": {
                            "department_id": "15",
                            "name": "Sloan School of Management",
                        },
                        "listing_type": CourseNumberType.primary.value,
                    }
                ]
            },
        }
        if not is_course_run_deleted:
            assert transformed_courses[1]["published"] is False
            assert transformed_courses[1]["runs"][0]["published"] is False
