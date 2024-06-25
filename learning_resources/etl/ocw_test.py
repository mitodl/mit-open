"""Next OCW ETL tests"""

import json
from datetime import UTC, datetime
from pathlib import Path

import boto3
import pytest
from moto import mock_s3

from learning_resources.conftest import OCW_TEST_PREFIX, setup_s3_ocw
from learning_resources.constants import DEPARTMENTS
from learning_resources.etl.constants import CourseNumberType, ETLSource
from learning_resources.etl.ocw import (
    transform_content_files,
    transform_contentfile,
    transform_course,
)
from learning_resources.etl.utils import clean_data
from learning_resources.factories import ContentFileFactory
from learning_resources.models import ContentFile
from learning_resources.utils import (
    get_s3_object_and_read,
    safe_load_json,
)
from main.utils import now_in_utc

pytestmark = pytest.mark.django_db


@mock_s3
@pytest.mark.parametrize("base_ocw_url", ["http://test.edu/", "http://test.edu"])
def test_transform_content_files(settings, mocker, base_ocw_url):
    """
    Test transform_content_files
    """
    settings.OCW_BASE_URL = base_ocw_url
    ocw_url = base_ocw_url.rstrip("/")
    setup_s3_ocw(settings)
    s3_resource = boto3.resource("s3")
    mocker.patch(
        "learning_resources.etl.ocw.extract_text_metadata",
        return_value={"content": "TEXT"},
    )

    content_data = list(
        transform_content_files(s3_resource, OCW_TEST_PREFIX, False)  # noqa: FBT003
    )

    assert len(content_data) == 4

    assert content_data[0] == {
        "content": "Pages Section",
        "content_type": "page",
        "key": (
            "courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/pages/"
        ),
        "published": True,
        "title": "Pages",
        "content_title": "Pages",
        "url": f"{ocw_url}/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/pages/",
    }

    assert content_data[1] == {
        "content": "Course Meeting Times Lecture",
        "content_type": "page",
        "key": "courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/pages/syllabus/",
        "published": True,
        "title": "Syllabus",
        "content_title": "Syllabus",
        "url": f"{ocw_url}/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/pages/syllabus/",
    }

    assert content_data[2] == {
        "content": "TEXT",
        "content_type": "pdf",
        "description": "This resource contains problem set 1",
        "file_type": "application/pdf",
        "key": "courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/resources/resource/",
        "content_tags": [
            "Activity Assignments",
            "Activity Assignments with Examples",
        ],
        "published": True,
        "title": "Resource Title",
        "content_title": "Resource Title",
        "url": f"{ocw_url}/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/resources/resource/",
    }

    assert content_data[3] == {
        "content": "TEXT",
        "content_type": "video",
        "description": "Video Description",
        "file_type": "video/mp4",
        "key": "courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/resources/video/",
        "content_tags": ["Competition Videos"],
        "published": True,
        "title": None,
        "content_title": None,
        "url": f"{ocw_url}/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/resources/video/",
        "image_src": "https://img.youtube.com/vi/vKer2U5W5-s/default.jpg",
    }


@mock_s3
def test_transform_content_files_exceptions(settings, mocker):
    """
    Test transform_content_files
    """

    setup_s3_ocw(settings)
    s3_resource = boto3.resource("s3")
    mock_log = mocker.patch("learning_resources.etl.ocw.log.exception")
    mocker.patch(
        "learning_resources.etl.ocw.get_s3_object_and_read", side_effect=Exception
    )
    content_data = list(
        transform_content_files(s3_resource, OCW_TEST_PREFIX, False)  # noqa: FBT003
    )
    assert len(content_data) == 0
    assert mock_log.call_count == 5


@mock_s3
@pytest.mark.parametrize("overwrite", [True, False])
@pytest.mark.parametrize("modified_after_last_import", [True, False])
def test_transform_content_file_needs_text_update(
    settings, mocker, overwrite, modified_after_last_import
):
    """
    Test transform_resource
    """

    setup_s3_ocw(settings)
    s3_resource = boto3.resource("s3")
    mock_tika = mocker.patch(
        "learning_resources.etl.ocw.extract_text_metadata",
        return_value={"content": "TEXT"},
    )
    s3_resource_object = s3_resource.Object(
        settings.OCW_LIVE_BUCKET,
        "courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/resources/resource/data.json",
    )
    resource_json = safe_load_json(
        get_s3_object_and_read(s3_resource_object), s3_resource_object.key
    )

    ContentFileFactory.create(
        key="courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/resources/resource/"
    )

    if modified_after_last_import:
        ContentFile.objects.update(updated_on=datetime(2020, 12, 1, tzinfo=UTC))

    content_data = transform_contentfile(
        s3_resource_object.key, resource_json, s3_resource, overwrite
    )

    if overwrite or modified_after_last_import:
        mock_tika.assert_called_once()

        assert content_data["content"] == "TEXT"
    else:
        mock_tika.assert_not_called()
        assert "content" not in content_data


@mock_s3
@pytest.mark.parametrize(
    (
        "legacy_uid",
        "site_uid",
        "expected_uid",
        "has_extra_num",
        "term",
        "year",
        "expected_id",
    ),
    [
        ("legacy-uid", None, "legacyuid", False, "Spring", "2005", "16.01+spring_2005"),
        (None, "site-uid", "siteuid", True, "", 2005, "16.01_2005"),
        (None, "site-uid", "siteuid", True, "Fall", 2005, "16.01+fall_2005"),
        (None, "site-uid", "siteuid", True, "Fall", None, "16.01+fall"),
        (None, "site-uid", "siteuid", True, "", "", "16.01"),
        (None, "site-uid", "siteuid", True, None, None, "16.01"),
        (None, None, None, True, "Spring", "2005", None),
    ],
)
def test_transform_course(  # noqa: PLR0913
    settings, legacy_uid, site_uid, expected_uid, has_extra_num, term, year, expected_id
):
    """transform_course should return expected data"""
    settings.OCW_BASE_URL = "http://test.edu/"
    with Path.open(
        Path(__file__).parent.parent.parent
        / "test_json/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006"
        / "data.json"
    ) as inf:
        course_json = json.load(inf)

    course_json["term"] = term
    course_json["year"] = year
    course_json["legacy_uid"] = legacy_uid
    course_json["site_uid"] = site_uid
    course_json["extra_course_numbers"] = "1, 2" if has_extra_num else None
    extracted_json = {
        **course_json,
        "last_modified": now_in_utc(),
        "slug": "slug",
        "url": "http://test.edu/slug",
    }
    transformed_json = transform_course(extracted_json)
    if expected_uid:
        assert transformed_json["readable_id"] == expected_id
        assert transformed_json["etl_source"] == ETLSource.ocw.name
        assert transformed_json["runs"][0]["run_id"] == expected_uid
        assert transformed_json["runs"][0]["level"] == ["undergraduate", "high_school"]
        assert transformed_json["runs"][0]["semester"] == (term if term else None)
        assert transformed_json["runs"][0]["year"] == (year if year else None)
        assert transformed_json["description"] == clean_data(
            course_json["course_description_html"]
        )
        assert (
            transformed_json["image"]["url"]
            == "http://test.edu/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/8f56bbb35d0e456dc8b70911bec7cd0d_16-01f05.jpg"
        )
        assert (
            transformed_json["image"]["alt"]
            == "Illustration of an aircraft wing showing connections between the"
            " disciplines of the course."
        )
        assert transformed_json["course"]["course_numbers"][0] == {
            "value": "16.01",
            "department": {"department_id": "16", "name": DEPARTMENTS["16"]},
            "listing_type": CourseNumberType.primary.value,
            "primary": True,
            "sort_coursenum": "16.01",
        }
        assert transformed_json["course"]["course_numbers"][1:] == (
            [
                {
                    "value": "1",
                    "department": {"department_id": "1", "name": DEPARTMENTS["1"]},
                    "listing_type": CourseNumberType.cross_listed.value,
                    "primary": False,
                    "sort_coursenum": "01",
                },
                {
                    "value": "2",
                    "department": {"department_id": "2", "name": DEPARTMENTS["2"]},
                    "listing_type": CourseNumberType.cross_listed.value,
                    "primary": False,
                    "sort_coursenum": "02",
                },
            ]
            if has_extra_num
            else []
        )
    else:
        assert transformed_json is None
