"""
Test tasks
"""
from unittest.mock import ANY

import pytest
from decorator import contextmanager
from moto import mock_s3

from learning_resources import factories, models, tasks
from learning_resources.conftest import setup_s3
from learning_resources.constants import LearningResourceType, PlatformType

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
    return mocker.patch("learning_resources.api.log.exception")


@pytest.fixture()
def mock_blocklist(mocker):
    """Mock the load_course_blocklist function"""
    return mocker.patch(
        "learning_resources.tasks.load_course_blocklist", return_value=[]
    )


def test_get_xpro_data(mocker):
    """Verify that the get_xpro_data invokes the xPro ETL pipeline"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")
    tasks.get_xpro_data.delay()
    mock_pipelines.xpro_programs_etl.assert_called_once_with()
    mock_pipelines.xpro_courses_etl.assert_called_once_with()


@mock_s3
def test_import_all_xpro_files(settings, mocker, mocked_celery, mock_blocklist):
    """import_all_xpro_files should start chunked tasks with correct bucket, platform"""
    setup_s3(settings)
    get_content_tasks_mock = mocker.patch(
        "learning_resources.tasks.get_content_tasks", autospec=True
    )
    with pytest.raises(mocked_celery.replace_exception_class):
        tasks.import_all_xpro_files.delay(3)
    get_content_tasks_mock.assert_called_once_with(PlatformType.xpro.value, 3)


@mock_s3
def test_get_content_tasks(settings, mocker, mocked_celery, mock_xpro_learning_bucket):
    """Test that get_content_tasks calls get_content_files with the correct args"""
    mock_get_content_files = mocker.patch(
        "learning_resources.tasks.get_content_files.si"
    )
    mocker.patch("learning_resources.tasks.load_course_blocklist", return_value=[])
    mocker.patch(
        "learning_resources.tasks.get_most_recent_course_archives",
        return_value=["foo.tar.gz"],
    )
    setup_s3(settings)
    settings.LEARNING_COURSE_ITERATOR_CHUNK_SIZE = 2
    platform = PlatformType.xpro.value
    factories.CourseFactory.create_batch(3, platform=platform)

    s3_prefix = "course-prefix"
    tasks.get_content_tasks(platform, s3_prefix=s3_prefix)
    assert mocked_celery.group.call_count == 1
    assert (
        models.LearningResource.objects.filter(
            published=True,
            resource_type=LearningResourceType.course.value,
            platform=platform,
        )
        .order_by("id")
        .values_list("id", flat=True)
    ).count() == 3
    assert mock_get_content_files.call_count == 2
    mock_get_content_files.assert_any_call(
        ANY, platform, ["foo.tar.gz"], s3_prefix=s3_prefix
    )


def test_get_content_files(mocker, mock_xpro_learning_bucket):
    """Test that get_content_files calls sync_edx_course_files with expected parameters"""
    mock_sync_edx_course_files = mocker.patch(
        "learning_resources.tasks.sync_edx_course_files"
    )
    mocker.patch(
        "learning_resources.tasks.get_learning_course_bucket_name",
        return_value=mock_xpro_learning_bucket.bucket.name,
    )
    tasks.get_content_files([1, 2], PlatformType.xpro.value, ["foo.tar.gz"])
    mock_sync_edx_course_files.assert_called_once_with(
        PlatformType.xpro.value, [1, 2], ["foo.tar.gz"], s3_prefix=None
    )


def test_get_content_files_missing_settings(mocker, settings):
    """Test that get_content_files does nothing without required settings"""
    mock_sync_edx_course_files = mocker.patch(
        "learning_resources.tasks.sync_edx_course_files"
    )
    mock_log = mocker.patch("learning_resources.tasks.log.warning")
    settings.XPRO_LEARNING_COURSE_BUCKET_NAME = None
    platform = PlatformType.xpro.value
    tasks.get_content_files([1, 2], platform, ["foo.tar.gz"])
    mock_sync_edx_course_files.assert_not_called()
    mock_log.assert_called_once_with("Required settings missing for %s files", platform)
