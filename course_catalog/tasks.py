"""
course_catalog tasks
"""
import logging

from course_catalog.etl import pipelines, youtube
from open_discussions.celery import app

log = logging.getLogger(__name__)


@app.task
def get_prolearn_data():
    """Execute the ProLearn ETL pipelines"""
    courses = pipelines.prolearn_courses_etl()
    programs = pipelines.prolearn_programs_etl()
    return len(programs + courses)


@app.task
def get_youtube_data(*, channel_ids=None):
    """
    Execute the YouTube ETL pipeline

    Args:
        channel_ids (list of str or None):
            if a list the extraction is limited to those channels

    Returns:
        int:
            The number of results that were fetched
    """
    results = pipelines.youtube_etl(channel_ids=channel_ids)

    return len(list(results))


@app.task
def get_youtube_transcripts(
    *, created_after=None, created_minutes=None, overwrite=False
):
    """
    Fetch transcripts for Youtube videos

    Args:
        created_after (date or None):
            if a string transcripts are pulled only for videos added to the course catalog after that date
        created_minutes (int or None):
            if a string transcripts are pulled only from videos added created_minutes ago and after
        overwrite (bool):
            if true youtube transcriptsipts are updated for videos that already have transcripts
    """  # noqa: E501

    videos = youtube.get_youtube_videos_for_transcripts_job(
        created_after=created_after,
        created_minutes=created_minutes,
        overwrite=overwrite,
    )

    log.info("Updating transcripts for %i videos", videos.count())
    youtube.get_youtube_transcripts(videos)


@app.task
def get_video_topics(*, video_ids=None):
    """
    Execute the video topics pipeline

    Args:
        video_ids (list of int):
            list of video ids to generate topics for
    """
    pipelines.video_topics_etl(video_ids=video_ids)
