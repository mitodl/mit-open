"""
Test tasks
"""

from datetime import timedelta
from unittest.mock import ANY

import pytest
from decorator import contextmanager
from django.utils import timezone
from moto import mock_s3

from learning_resources import factories, models, tasks
from learning_resources.conftest import OCW_TEST_PREFIX, setup_s3, setup_s3_ocw
from learning_resources.constants import LearningResourceType, PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.factories import (
    LearningResourceFactory,
)
from learning_resources.tasks import (
    get_ocw_data,
    get_youtube_data,
    get_youtube_transcripts,
    update_next_start_date_and_prices,
)

pytestmark = pytest.mark.django_db
# pylint:disable=redefined-outer-name,unused-argument,too-many-arguments


@contextmanager
def does_not_raise():
    """
    Mock expression that does not raise an error
    """
    yield


@pytest.fixture
def mock_logger(mocker):
    """
    Mock log exception
    """
    return mocker.patch("learning_resources.api.log.exception")


@pytest.fixture
def mock_blocklist(mocker):
    """Mock the load_course_blocklist function"""
    return mocker.patch(
        "learning_resources.tasks.load_course_blocklist", return_value=[]
    )


def test_cache_is_cleared_after_task_run(mocker, mocked_celery):
    """Test that the search cache is cleared out after every task run"""
    mocker.patch("learning_resources.tasks.ocw_courses_etl", autospec=True)
    mocker.patch("learning_resources.tasks.get_content_tasks", autospec=True)
    mocker.patch("learning_resources.tasks.pipelines")
    mocked_clear_search_cache = mocker.patch(
        "learning_resources.tasks.clear_search_cache"
    )
    tasks.get_mit_edx_data.delay()
    tasks.update_next_start_date_and_prices.delay()
    tasks.get_micromasters_data.delay()
    tasks.get_mit_edx_data.delay()
    tasks.get_mitxonline_data.delay()
    tasks.get_oll_data.delay()
    tasks.get_prolearn_data.delay()
    tasks.get_xpro_data.delay()
    tasks.get_podcast_data.delay()

    tasks.get_ocw_courses.delay(
        url_paths=[OCW_TEST_PREFIX],
        force_overwrite=False,
        skip_content_files=True,
    )

    tasks.get_youtube_data.delay()
    tasks.get_youtube_transcripts.delay()
    assert mocked_clear_search_cache.call_count == 12


def test_get_micromasters_data(mocker):
    """Verify that the get_micromasters_data invokes the MicroMasters ETL pipeline"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")

    tasks.get_micromasters_data.delay()
    mock_pipelines.micromasters_etl.assert_called_once_with()


def test_get_mit_edx_data_valid(mocker):
    """Verify that the get_mit_edx_data invokes the MIT edX ETL pipelines"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")

    tasks.get_mit_edx_data.delay()
    mock_pipelines.mit_edx_courses_etl.assert_called_once_with(None)
    mock_pipelines.mit_edx_programs_etl.assert_called_once_with(None)


def test_get_mitxonline_data(mocker):
    """Verify that the get_mitxonline_data invokes the MITx Online ETL pipeline"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")
    tasks.get_mitxonline_data.delay()
    mock_pipelines.mitxonline_programs_etl.assert_called_once_with()
    mock_pipelines.mitxonline_courses_etl.assert_called_once_with()


def test_get_oll_data(mocker):
    """Verify that the get_oll_data invokes the OLL ETL pipeline"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")
    tasks.get_oll_data.delay()
    mock_pipelines.oll_etl.assert_called_once_with(None)


def test_get_mitpe_data(mocker):
    """Verify that the get_mitpe_data task invokes the Professional Ed pipeline"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")
    mock_pipelines.mitpe_etl.return_value = (
        LearningResourceFactory.create_batch(2),
        LearningResourceFactory.create_batch(1),
    )
    task = tasks.get_mitpe_data.delay()
    mock_pipelines.mitpe_etl.assert_called_once_with()
    assert task.result == 3


def test_get_prolearn_data(mock_pipelines):
    """Verify that the get_prolearn_data invokes the Prolearn ETL pipeline"""
    tasks.get_prolearn_data.delay()
    mock_pipelines.prolearn_programs_etl.assert_called_once_with()
    mock_pipelines.prolearn_courses_etl.assert_called_once_with()


def test_get_xpro_data(mocker):
    """Verify that the get_xpro_data invokes the xPro ETL pipeline"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")
    tasks.get_xpro_data.delay()
    mock_pipelines.xpro_programs_etl.assert_called_once_with()
    mock_pipelines.xpro_courses_etl.assert_called_once_with()


@mock_s3
def test_import_all_mit_edx_files(settings, mocker, mocked_celery, mock_blocklist):
    """import_all_mit_edx_files should start chunked tasks with correct bucket, platform"""
    setup_s3(settings)
    get_content_tasks_mock = mocker.patch(
        "learning_resources.tasks.get_content_tasks", autospec=True
    )
    with pytest.raises(mocked_celery.replace_exception_class):
        tasks.import_all_mit_edx_files.delay(4)
    get_content_tasks_mock.assert_called_once_with(
        ETLSource.mit_edx.name,
        chunk_size=4,
        s3_prefix="simeon-mitx-course-tarballs",
    )


@mock_s3
def test_import_all_mitxonline_files(settings, mocker, mocked_celery, mock_blocklist):
    """import_all_mitxonline_files should be replaced with get_content_tasks"""
    setup_s3(settings)
    get_content_tasks_mock = mocker.patch(
        "learning_resources.tasks.get_content_tasks", autospec=True
    )

    with pytest.raises(mocked_celery.replace_exception_class):
        tasks.import_all_mitxonline_files.delay(3)
    get_content_tasks_mock.assert_called_once_with(
        PlatformType.mitxonline.name,
        chunk_size=3,
    )


@mock_s3
def test_import_all_xpro_files(settings, mocker, mocked_celery, mock_blocklist):
    """import_all_xpro_files should start chunked tasks with correct bucket, platform"""
    setup_s3(settings)
    get_content_tasks_mock = mocker.patch(
        "learning_resources.tasks.get_content_tasks", autospec=True
    )
    with pytest.raises(mocked_celery.replace_exception_class):
        tasks.import_all_xpro_files.delay(3)
    get_content_tasks_mock.assert_called_once_with(PlatformType.xpro.name, chunk_size=3)


@mock_s3
def test_import_all_oll_files(settings, mocker, mocked_celery, mock_blocklist):
    """import_all_oll_files should start chunked tasks with correct bucket, platform"""
    setup_s3(settings)
    get_content_tasks_mock = mocker.patch(
        "learning_resources.tasks.get_content_tasks", autospec=True
    )
    with pytest.raises(mocked_celery.replace_exception_class):
        tasks.import_all_oll_files.delay(4)
    get_content_tasks_mock.assert_called_once_with(
        ETLSource.oll.name,
        chunk_size=4,
        s3_prefix="open-learning-library/courses",
        override_base_prefix=True,
    )


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
    etl_source = ETLSource.xpro.name
    platform = PlatformType.xpro.name
    factories.CourseFactory.create_batch(3, etl_source=etl_source, platform=platform)
    s3_prefix = "course-prefix"
    tasks.get_content_tasks(etl_source, s3_prefix=s3_prefix)
    assert mocked_celery.group.call_count == 1
    assert (
        models.LearningResource.objects.filter(
            published=True,
            resource_type=LearningResourceType.course.name,
            etl_source=etl_source,
            platform__code=platform,
        )
        .order_by("id")
        .values_list("id", flat=True)
    ).count() == 3
    assert mock_get_content_files.call_count == 2
    mock_get_content_files.assert_any_call(
        ANY, etl_source, ["foo.tar.gz"], s3_prefix=s3_prefix
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


def test_get_podcast_data(mocker):
    """Verify that get_podcast_data invokes the podcast ETL pipeline with expected params"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")
    tasks.get_podcast_data.delay()
    mock_pipelines.podcast_etl.assert_called_once()


@mock_s3
@pytest.mark.parametrize(
    ("force_overwrite", "skip_content_files"), [(True, False), (False, True)]
)
@pytest.mark.parametrize(
    "url_substring",
    [
        None,
        "16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006",
        "not-a-match",
    ],
)
def test_get_ocw_data(  # noqa: PLR0913
    settings, mocker, mocked_celery, force_overwrite, skip_content_files, url_substring
):
    """Test get_ocw_data task"""
    setup_s3_ocw(settings)
    get_ocw_courses_mock = mocker.patch(
        "learning_resources.tasks.get_ocw_courses", autospec=True
    )

    if url_substring == "not-a-match":
        error_expectation = does_not_raise()
    else:
        error_expectation = pytest.raises(mocked_celery.replace_exception_class)

    with error_expectation:
        tasks.get_ocw_data.delay(
            force_overwrite=force_overwrite,
            course_url_substring=url_substring,
            skip_content_files=skip_content_files,
        )

    if url_substring == "not-a-match":
        assert mocked_celery.group.call_count == 0
    else:
        assert mocked_celery.group.call_count == 1
        get_ocw_courses_mock.si.assert_called_once_with(
            url_paths=[OCW_TEST_PREFIX],
            force_overwrite=force_overwrite,
            skip_content_files=skip_content_files,
            utc_start_timestamp=None,
        )


def test_get_ocw_data_no_settings(settings, mocker):
    """Test get_ocw_data task without required settings"""
    settings.OCW_LIVE_BUCKET = None
    mock_log = mocker.patch("learning_resources.tasks.log.warning")
    get_ocw_data()
    mock_log.assert_called_once_with("Required settings missing for get_ocw_data")


@mock_s3
@pytest.mark.parametrize("timestamp", [None, "2020-12-15T00:00:00Z"])
@pytest.mark.parametrize("overwrite", [True, False])
def test_get_ocw_courses(settings, mocker, mocked_celery, timestamp, overwrite):
    """
    Test get_ocw_courses
    """
    setup_s3_ocw(settings)
    mocker.patch("learning_resources.etl.loaders.resource_upserted_actions")
    mocker.patch("learning_resources.etl.pipelines.loaders.load_content_files")
    mocker.patch("learning_resources.etl.ocw.transform_content_files")
    tasks.get_ocw_courses.delay(
        url_paths=[OCW_TEST_PREFIX],
        force_overwrite=overwrite,
        skip_content_files=False,
        utc_start_timestamp=timestamp,
    )

    assert models.LearningResource.objects.count() == 1
    assert models.Course.objects.count() == 1
    assert models.LearningResourceInstructor.objects.count() == 10

    course_resource = models.Course.objects.first().learning_resource
    assert course_resource.title == "Unified Engineering I, II, III, & IV"
    assert course_resource.readable_id == "16.01+fall_2005"
    assert course_resource.runs.count() == 1
    assert course_resource.runs.first().run_id == "97db384ef34009a64df7cb86cf701979"
    assert (
        course_resource.runs.first().slug
        == "courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006"
    )


@pytest.mark.parametrize("channel_ids", [["abc", "123"], None])
def test_get_youtube_data(mocker, settings, channel_ids):
    """Verify that the get_youtube_data invokes the YouTube ETL pipeline with expected params"""
    mock_pipelines = mocker.patch("learning_resources.tasks.pipelines")
    get_youtube_data.delay(channel_ids=channel_ids)
    mock_pipelines.youtube_etl.assert_called_once_with(channel_ids=channel_ids)


def test_get_youtube_transcripts(mocker):
    """Verify that get_youtube_transcripts invokes correct course_catalog.etl.youtube functions"""

    mock_etl_youtube = mocker.patch("learning_resources.tasks.youtube")

    get_youtube_transcripts(created_after=None, created_minutes=2000, overwrite=True)

    mock_etl_youtube.get_youtube_videos_for_transcripts_job.assert_called_once_with(
        created_after=None, created_minutes=2000, overwrite=True
    )

    mock_etl_youtube.get_youtube_transcripts.assert_called_once_with(
        mock_etl_youtube.get_youtube_videos_for_transcripts_job.return_value
    )


def test_update_next_start_date(mocker):
    learning_resource = LearningResourceFactory.create(
        next_start_date=(timezone.now() - timedelta(10))
    )
    LearningResourceFactory.create(next_start_date=(timezone.now() + timedelta(1)))

    mock_load_next_start_date = mocker.patch(
        "learning_resources.tasks.load_run_dependent_values"
    )
    update_next_start_date_and_prices()
    mock_load_next_start_date.assert_called_once_with(learning_resource)
