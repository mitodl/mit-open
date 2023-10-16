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
    assert resource.readable_id == "16.01+fall_2005"
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
