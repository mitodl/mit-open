"""
Test tasks
"""

import pytest

from course_catalog.tasks import (
    get_video_topics,
    get_youtube_data,
    get_youtube_transcripts,
)

pytestmark = pytest.mark.django_db
# pylint:disable=redefined-outer-name,unused-argument,too-many-arguments


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
