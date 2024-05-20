"""Tests for ETL pipelines"""

from contextlib import contextmanager
from datetime import UTC, datetime
from importlib import reload
from unittest.mock import patch

import pytest
from moto import mock_s3

from learning_resources.conftest import OCW_TEST_PREFIX, setup_s3_ocw
from learning_resources.constants import OfferedBy, PlatformType
from learning_resources.etl import pipelines
from learning_resources.etl.constants import (
    CourseLoaderConfig,
    ETLSource,
    ProgramLoaderConfig,
)
from learning_resources.etl.exceptions import ExtractException
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


def test_mit_edx_etl():
    """Verify that mit edx etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.mit_edx.extract", autospec=True),
        patch("learning_resources.etl.mit_edx.transform", autospec=False),
        patch("learning_resources.etl.loaders.load_courses", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_courses = patches
        result = pipelines.mit_edx_etl()

    mock_extract.assert_called_once_with()

    # each of these should be called with the return value of the extract
    mock_transform.assert_called_once_with(mock_extract.return_value)

    # load_courses should be called *only* with the return value of transform
    mock_load_courses.assert_called_once_with(
        ETLSource.mit_edx.name,
        mock_transform.return_value,
        config=CourseLoaderConfig(prune=True),
    )

    assert result == mock_load_courses.return_value


def test_mitxonline_programs_etl():
    """Verify that mitxonline programs etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.mitxonline.extract_programs", autospec=True),
        patch("learning_resources.etl.mitxonline.transform_programs", autospec=False),
        patch("learning_resources.etl.loaders.load_programs", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_programs = patches
        result = pipelines.mitxonline_programs_etl()

    mock_extract.assert_called_once_with()

    # each of these should be called with the return value of the extract
    mock_transform.assert_called_once_with(mock_extract.return_value)

    # load_courses should be called *only* with the return value of transform
    mock_load_programs.assert_called_once_with(
        ETLSource.mitxonline.name,
        mock_transform.return_value,
        config=ProgramLoaderConfig(courses=CourseLoaderConfig(prune=True)),
    )

    assert result == mock_load_programs.return_value


def test_mitxonline_courses_etl():
    """Verify that mitxonline courses etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.mitxonline.extract_courses", autospec=True),
        patch("learning_resources.etl.mitxonline.transform_courses", autospec=False),
        patch("learning_resources.etl.loaders.load_courses", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_courses = patches
        result = pipelines.mitxonline_courses_etl()

    mock_extract.assert_called_once_with()

    # each of these should be called with the return value of the extract
    mock_transform.assert_called_once_with(mock_extract.return_value)

    # load_courses should be called *only* with the return value of transform
    mock_load_courses.assert_called_once_with(
        ETLSource.mitxonline.name,
        mock_transform.return_value,
        config=CourseLoaderConfig(prune=True),
    )

    assert result == mock_load_courses.return_value


def test_oll_etl():
    """Verify that OLL etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.oll.extract", autospec=True),
        patch("learning_resources.etl.oll.transform", autospec=False),
        patch("learning_resources.etl.loaders.load_courses", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_courses = patches
        result = pipelines.oll_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_courses.assert_called_once_with(
        PlatformType.oll.name,
        mock_transform.return_value,
        config=CourseLoaderConfig(prune=True),
    )

    assert result == mock_load_courses.return_value


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
        ETLSource.xpro.name,
        mock_transform.return_value,
        config=ProgramLoaderConfig(courses=CourseLoaderConfig(prune=True)),
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
        ETLSource.xpro.name,
        mock_transform.return_value,
        config=CourseLoaderConfig(prune=True),
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
@pytest.mark.parametrize("skip_content_files", [True, False])
def test_ocw_courses_etl(settings, mocker, skip_content_files):
    """Test ocw_courses_etl"""
    setup_s3_ocw(settings)

    mocker.patch(
        "learning_resources.etl.ocw.extract_text_metadata",
        return_value={"content": "TEXT"},
    )
    mocker.patch("learning_resources.etl.pipelines.loaders.resource_upserted_actions")
    mocker.patch(
        "learning_resources.etl.pipelines.loaders.resource_run_upserted_actions"
    )
    mocker.patch(
        "learning_resources.etl.pipelines.loaders.resource_unpublished_actions"
    )

    pipelines.ocw_courses_etl(
        url_paths=[OCW_TEST_PREFIX],
        force_overwrite=True,
        start_timestamp=datetime(2020, 12, 15, tzinfo=UTC),
        skip_content_files=skip_content_files,
    )

    resource = LearningResource.objects.first()
    assert resource.readable_id == "16.01+fall_2005"
    assert [num["value"] for num in resource.course.course_numbers] == [
        "16.01",
        "16.02",
        "16.03",
        "16.04",
    ]
    assert resource.platform.code == PlatformType.ocw.name
    assert resource.offered_by.code == OfferedBy.ocw.name
    assert resource.departments.first().department_id == "16"
    assert resource.content_tags.count() == 5
    run = resource.runs.first()
    assert run.instructors.count() == 10
    assert run.run_id == "97db384ef34009a64df7cb86cf701979"
    assert run.content_files.count() == (0 if skip_content_files else 4)


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
        start_timestamp=datetime(2020, 12, 15, tzinfo=UTC),
    )
    mock_log.assert_called_once_with("No course data found for %s", s3_path)


@mock_s3
@pytest.mark.django_db()
def test_ocw_courses_etl_exception(settings, mocker):
    """Test ocw_courses_etl when bad data raises an exception"""

    mock_log = mocker.patch("learning_resources.etl.pipelines.log.exception")
    mocker.patch(
        "learning_resources.etl.pipelines.ocw.extract_course", side_effect=[Exception]
    )
    url_paths = ["courses/1", "courses/2", "courses/3"]
    with pytest.raises(ExtractException) as ex:
        pipelines.ocw_courses_etl(
            url_paths=url_paths,
            force_overwrite=True,
            start_timestamp=datetime(2020, 12, 15, tzinfo=UTC),
        )
    assert str(ex.value) == "Some OCW urls raised errors: %s" % ",".join(url_paths)
    for path in url_paths:
        mock_log.assert_any_call("Error encountered parsing OCW json for %s", path)


def test_micromasters_etl():
    """Verify that micromasters etl pipeline executes correctly"""
    values = [1, 2, 3]

    with reload_mocked_pipeline(
        patch("learning_resources.etl.micromasters.extract", autospec=True),
        patch(
            "learning_resources.etl.micromasters.transform",
            return_value=values,
            autospec=True,
        ),
        patch("learning_resources.etl.loaders.load_programs", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_programs = patches
        result = pipelines.micromasters_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_programs.assert_called_once_with(
        ETLSource.micromasters.name,
        mock_transform.return_value,
        config=ProgramLoaderConfig(prune=True, courses=CourseLoaderConfig()),
    )

    assert result == mock_load_programs.return_value


def test_prolearn_programs_etl():
    """Verify that prolearn programs etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.prolearn.extract_programs", autospec=True),
        patch("learning_resources.etl.prolearn.transform_programs", autospec=True),
        patch("learning_resources.etl.loaders.load_programs", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_programs = patches
        result = pipelines.prolearn_programs_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_programs.assert_called_once_with(
        ETLSource.prolearn.name,
        mock_transform.return_value,
        config=ProgramLoaderConfig(courses=CourseLoaderConfig(prune=True)),
    )

    assert result == mock_load_programs.return_value


def test_prolearn_courses_etl():
    """Verify that prolearn courses etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.prolearn.extract_courses", autospec=True),
        patch("learning_resources.etl.prolearn.transform_courses", autospec=True),
        patch("learning_resources.etl.loaders.load_courses", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_courses = patches
        result = pipelines.prolearn_courses_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_courses.assert_called_once_with(
        ETLSource.prolearn.name,
        mock_transform.return_value,
        config=CourseLoaderConfig(prune=True),
    )

    assert result == mock_load_courses.return_value


def test_posthog_etl():
    """Verify that posthog etl pipeline executes correctly"""

    with reload_mocked_pipeline(
        patch(
            "learning_resources.etl.posthog.posthog_extract_lrd_view_events",
            autospec=True,
        ),
        patch(
            "learning_resources.etl.posthog.posthog_transform_lrd_view_events",
            autospec=True,
        ),
        patch(
            "learning_resources.etl.posthog.load_posthog_lrd_view_events", autospec=True
        ),
    ) as patches:
        mock_extract, mock_transform, mock_load_events = patches
        result = pipelines.posthog_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_events.assert_called_once_with(mock_transform.return_value)

    assert result == mock_load_events.return_value
