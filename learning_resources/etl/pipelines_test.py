"""Tests for ETL pipelines"""
from contextlib import contextmanager
from datetime import datetime
from importlib import reload
from unittest.mock import patch

import pytest
import pytz
from moto import mock_s3

from learning_resources.conftest import OCW_TEST_PREFIX, setup_s3_ocw
from learning_resources.constants import OfferedBy, PlatformType
from learning_resources.etl import pipelines
from learning_resources.models import LearningResource


@pytest.fixture()
def ocw_valid_data():
    """
    Return valid ocw data
    """
    return {
        "course_title": "Unified Engineering I, II, III, \u0026 IV",
        "course_description": "The basic objective of Unified Engineering is to give a solid understanding of the fundamental disciplines of aerospace engineering, as well as their interrelationships and applications. These disciplines are Materials and Structures (M); Computers and Programming (C); Fluid Mechanics (F); Thermodynamics (T); Propulsion (P); and Signals and Systems (S). In choosing to teach these subjects in a unified manner, the instructors seek to explain the common intellectual threads in these disciplines, as well as their combined application to solve engineering Systems Problems (SP). Throughout the year, the instructors emphasize the connections among the disciplines",
        "site_uid": None,
        "legacy_uid": "97db384e-f340-09a6-4df7-cb86cf701979",
        "instructors": [
            {
                "first_name": "Mark",
                "last_name": "Drela",
                "middle_initial": "",
                "salutation": "Prof.",
                "title": "Prof. Mark Drela",
            },
            {
                "first_name": "Steven",
                "last_name": "Hall",
                "middle_initial": "",
                "salutation": "Prof.",
                "title": "Prof. Steven Hall",
            },
        ],
        "department_numbers": ["16"],
        "learning_resource_types": [
            "Lecture Videos",
            "Course Introduction",
            "Competition Videos",
            "Problem Sets with Solutions",
            "Exams with Solutions",
        ],
        "topics": [
            ["Engineering", "Aerospace Engineering", "Materials Selection"],
            ["Engineering", "Aerospace Engineering", "Propulsion Systems"],
            ["Science", "Physics", "Thermodynamics"],
            ["Engineering", "Mechanical Engineering", "Fluid Mechanics"],
            ["Engineering", "Aerospace Engineering"],
            ["Business", "Project Management"],
        ],
        "primary_course_number": "16.01",
        "extra_course_numbers": "16.02, 16.03, 16.04, 17.01",
        "term": "Fall",
        "year": "2005",
        "level": ["Undergraduate"],
        "image_src": "https://open-learning-course-data-production.s3.amazonaws.com/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/8f56bbb35d0e456dc8b70911bec7cd0d_16-01f05.jpg",
        "course_image_metadata": {
            "description": "An abstracted aircraft wing with illustrated systems. (Image by MIT OCW.)",
            "draft": False,
            "file": "https://open-learning-course-data-production.s3.amazonaws.com/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/8f56bbb35d0e456dc8b70911bec7cd0d_16-01f05.jpg",
            "file_type": "image/jpeg",
            "image_metadata": {
                "caption": "An abstracted aircraft wing, illustrating the connections between the disciplines of Unified Engineering. (Image by MIT OpenCourseWare.)",
                "credit": "",
                "image-alt": "Illustration of an aircraft wing showing connections between the disciplines of the course.",
            },
            "iscjklanguage": False,
            "resourcetype": "Image",
            "title": "16-01f05.jpg",
            "uid": "8f56bbb3-5d0e-456d-c8b7-0911bec7cd0d",
        },
    }


@contextmanager
def reload_mocked_pipeline(*patchers):
    """Create a context that is rolled back after executing the pipeline"""
    mocks = [patcher.start() for patcher in patchers]

    reload(pipelines)

    yield mocks

    for patcher in patchers:
        patcher.stop()

    reload(pipelines)


def test_xpro_programs_etl():
    """Verify that xpro programs etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.xpro.extract_programs", autospec=True),
        patch("learning_resources.etl.xpro.transform_programs", autospec=True),
        patch("learning_resources.etl.loaders.load_programs", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_programs = patches
        result = pipelines.xpro_programs_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_programs.assert_called_once_with(
        PlatformType.xpro.value, mock_transform.return_value
    )

    assert result == mock_load_programs.return_value


def test_xpro_courses_etl():
    """Verify that xpro courses etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.xpro.extract_courses", autospec=True),
        patch("learning_resources.etl.xpro.transform_courses", autospec=True),
        patch("learning_resources.etl.loaders.load_courses", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_courses = patches
        result = pipelines.xpro_courses_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_courses.assert_called_once_with(
        PlatformType.xpro.value,
        mock_transform.return_value,
    )

    assert result == mock_load_courses.return_value


def test_podcast_etl():
    """Verify that podcast etl pipeline executes correctly"""

    with reload_mocked_pipeline(
        patch("learning_resources.etl.podcast.extract", autospec=True),
        patch("learning_resources.etl.podcast.transform", autospec=True),
        patch("learning_resources.etl.loaders.load_podcasts", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_podcasts = patches
        result = pipelines.podcast_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_podcasts.assert_called_once_with(mock_transform.return_value)

    assert result == mock_load_podcasts.return_value


@mock_s3
@pytest.mark.django_db()
def test_ocw_courses_etl(settings, mocker):
    """Test ocw_courses_etl"""

    setup_s3_ocw(settings)

    mocker.patch(
        "learning_resources.etl.ocw.extract_text_metadata",
        return_value={"content": "TEXT"},
    )
    mocker.patch("learning_resources.etl.pipelines.loaders.search_index_helpers")

    pipelines.ocw_courses_etl(
        url_paths=[OCW_TEST_PREFIX],
        force_overwrite=True,
        start_timestamp=datetime(2020, 12, 15, tzinfo=pytz.utc),
    )

    resource = LearningResource.objects.first()
    assert resource.readable_id == "16.01"
    assert resource.course.extra_course_numbers == ["16.02", "16.03", "16.04"]
    assert resource.platform.platform == PlatformType.ocw.value
    assert resource.offered_by.name == OfferedBy.ocw.value
    assert resource.departments.first().department_id == "16"
    assert resource.resource_content_tags.count() == 5
    run = resource.runs.first()
    assert run.instructors.count() == 10
    assert run.run_id == "97db384ef34009a64df7cb86cf701979"
    assert run.content_files.count() == 4


@mock_s3
@pytest.mark.django_db()
def test_ocw_courses_etl_no_data(settings, mocker):
    """Test ocw_courses_etl when no S3 data is present"""

    setup_s3_ocw(settings)
    mock_log = mocker.patch("learning_resources.etl.pipelines.log.info")

    s3_path = "fake_path"
    pipelines.ocw_courses_etl(
        url_paths=[s3_path],
        force_overwrite=True,
        start_timestamp=datetime(2020, 12, 15, tzinfo=pytz.utc),
    )
    mock_log.assert_called_once_with("No course data found for %s", s3_path)


@mock_s3
@pytest.mark.django_db()
def test_ocw_courses_etl_exception(settings, mocker):
    """Test ocw_courses_etl when bad data raises an exception"""

    mock_log = mocker.patch("learning_resources.etl.pipelines.log.exception")
    mocker.patch(
        "learning_resources.etl.pipelines.ocw.extract_course", side_effect=Exception
    )

    pipelines.ocw_courses_etl(
        url_paths=[OCW_TEST_PREFIX],
        force_overwrite=True,
        start_timestamp=datetime(2020, 12, 15, tzinfo=pytz.utc),
    )
    mock_log.assert_called_once_with(
        "Error encountered parsing OCW json for %s", OCW_TEST_PREFIX
    )
