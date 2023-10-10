"""
Test tasks
"""
from contextlib import contextmanager
from unittest.mock import ANY

import pytest
from moto import mock_s3

from course_catalog.conftest import setup_s3
from course_catalog.constants import PlatformType
from course_catalog.factories import CourseFactory
from course_catalog.models import Course
from course_catalog.tasks import (
    get_content_files,
    get_content_tasks,
    get_micromasters_data,
    get_mitx_data,
    get_mitxonline_data,
    get_oll_data,
    get_podcast_data,
    get_video_topics,
    get_xpro_data,
    get_youtube_data,
    get_youtube_transcripts,
    import_all_mitx_files,
    import_all_mitxonline_files,
)

pytestmark = pytest.mark.django_db
# pylint:disable=redefined-outer-name,unused-argument,too-many-arguments


@contextmanager
def does_not_raise():
    """
    Mock expression that does not raise an error
    """
    yield


@pytest.fixture()
def mock_logger(mocker):
    """
    Mock log exception
    """
    return mocker.patch("course_catalog.api.log.exception")


@pytest.fixture()
def mock_blocklist(mocker):
    """Mock the load_course_blocklist function"""
    return mocker.patch("course_catalog.tasks.load_course_blocklist", return_value=[])


def test_get_mitx_data_valid(mocker):
    """Verify that the get_mitx_data invokes the MITx ETL pipeline"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")

    get_mitx_data.delay()
    mock_pipelines.mitx_etl.assert_called_once_with()


@mock_s3
def test_import_all_mitx_files(settings, mocker, mocked_celery, mock_blocklist):
    """import_all_mitx_files should start chunked tasks with correct bucket, platform"""
    setup_s3(settings)
    get_content_tasks_mock = mocker.patch(
        "course_catalog.tasks.get_content_tasks", autospec=True
    )
    with pytest.raises(mocked_celery.replace_exception_class):
        import_all_mitx_files.delay(4)
    get_content_tasks_mock.assert_called_once_with(
        PlatformType.mitx.value,
        4,
        s3_prefix="simeon-mitx-course-tarballs",
    )


@mock_s3
def test_get_content_tasks(settings, mocker, mocked_celery, mock_mitx_learning_bucket):
    """Test that get_content_tasks calls get_content_files with the correct args"""
    mock_get_content_files = mocker.patch("course_catalog.tasks.get_content_files.si")
    mocker.patch("course_catalog.tasks.load_course_blocklist", return_value=[])
    mocker.patch(
        "course_catalog.tasks.get_most_recent_course_archives",
        return_value=["foo.tar.gz"],
    )
    setup_s3(settings)
    settings.LEARNING_COURSE_ITERATOR_CHUNK_SIZE = 2
    platform = PlatformType.mitx.value
    CourseFactory.create_batch(3, published=True, platform=platform)

    s3_prefix = "course-prefix"
    get_content_tasks(platform, s3_prefix=s3_prefix)
    assert mocked_celery.group.call_count == 1
    assert (
        Course.objects.filter(published=True)
        .filter(platform=platform)
        .exclude(course_id__in=[])
        .order_by("id")
        .values_list("id", flat=True)
    ).count() == 3
    assert mock_get_content_files.call_count == 2
    mock_get_content_files.assert_any_call(
        ANY, platform, ["foo.tar.gz"], s3_prefix=s3_prefix
    )


def test_get_content_files(mocker, mock_mitx_learning_bucket):
    """Test that get_content_files calls sync_edx_course_files with expected parameters"""
    mock_sync_edx_course_files = mocker.patch(
        "course_catalog.tasks.sync_edx_course_files"
    )
    mocker.patch(
        "course_catalog.tasks.get_learning_course_bucket_name",
        return_value=mock_mitx_learning_bucket.bucket.name,
    )
    get_content_files([1, 2], "mitx", ["foo.tar.gz"])
    mock_sync_edx_course_files.assert_called_once_with(
        "mitx", [1, 2], ["foo.tar.gz"], s3_prefix=None
    )


def test_get_content_files_missing_settings(mocker, settings):
    """Test that get_content_files does nothing without required settings"""
    mock_sync_edx_course_files = mocker.patch(
        "course_catalog.tasks.sync_edx_course_files"
    )
    mock_log = mocker.patch("course_catalog.tasks.log.warning")
    settings.MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME = None
    platform = "mitxonline"
    get_content_files([1, 2], platform, ["foo.tar.gz"])
    mock_sync_edx_course_files.assert_not_called()
    mock_log.assert_called_once_with("Required settings missing for %s files", platform)


@mock_s3
def test_import_all_mitxonline_files(settings, mocker, mocked_celery, mock_blocklist):
    """import_all_mitxonline_files should be replaced with get_content_tasks"""
    setup_s3(settings)
    get_content_tasks_mock = mocker.patch(
        "course_catalog.tasks.get_content_tasks", autospec=True
    )

    with pytest.raises(mocked_celery.replace_exception_class):
        import_all_mitxonline_files.delay(3)
    get_content_tasks_mock.assert_called_once_with(
        PlatformType.mitxonline.value,
        3,
    )


def test_get_micromasters_data(mocker):
    """Verify that the get_micromasters_data invokes the MicroMasters ETL pipeline"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")

    get_micromasters_data.delay()
    mock_pipelines.micromasters_etl.assert_called_once_with()


def test_get_xpro_data(mocker):
    """Verify that the get_xpro_data invokes the xPro ETL pipeline"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")
    get_xpro_data.delay()
    mock_pipelines.xpro_programs_etl.assert_called_once_with()
    mock_pipelines.xpro_courses_etl.assert_called_once_with()


def test_get_mitxonline_data(mocker):
    """Verify that the get_mitxonline_data invokes the MITx Online ETL pipeline"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")
    get_mitxonline_data.delay()
    mock_pipelines.mitxonline_programs_etl.assert_called_once_with()
    mock_pipelines.mitxonline_courses_etl.assert_called_once_with()


def test_get_oll_data(mocker):
    """Verify that the get_oll_data invokes the OLL ETL pipeline"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")
    get_oll_data.delay()
    mock_pipelines.oll_etl.assert_called_once_with()


@pytest.mark.parametrize("channel_ids", [["abc", "123"], None])
def test_get_youtube_data(mocker, settings, channel_ids):
    """Verify that the get_youtube_data invokes the YouTube ETL pipeline with expected params"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")
    get_youtube_data.delay(channel_ids=channel_ids)
    mock_pipelines.youtube_etl.assert_called_once_with(channel_ids=channel_ids)


def test_get_youtube_transcripts(mocker):
    """Verify that get_youtube_transcripts invokes correct course_catalog.etl.youtube functions"""

    mock_course_catalog_youtube = mocker.patch("course_catalog.tasks.youtube")

    get_youtube_transcripts(created_after=None, created_minutes=2000, overwrite=True)

    mock_course_catalog_youtube.get_youtube_videos_for_transcripts_job.assert_called_once_with(
        created_after=None, created_minutes=2000, overwrite=True
    )

    mock_course_catalog_youtube.get_youtube_transcripts.assert_called_once_with(
        mock_course_catalog_youtube.get_youtube_videos_for_transcripts_job.return_value
    )


@pytest.mark.parametrize("video_ids", [None, [1, 2]])
def test_get_video_topics(mocker, video_ids):
    """Test that get_video_topics calls the corresponding pipeline method"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")
    get_video_topics.delay(video_ids=video_ids)
    mock_pipelines.video_topics_etl.assert_called_once_with(video_ids=video_ids)


def test_get_podcast_data(mocker):
    """Verify that get_podcast_data invokes the podcast ETL pipeline with expected params"""
    mock_pipelines = mocker.patch("course_catalog.tasks.pipelines")
    get_podcast_data.delay()
    mock_pipelines.podcast_etl.assert_called_once()
