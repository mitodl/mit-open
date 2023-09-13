"""
learning_resources tasks
"""

import logging

import celery
from django.conf import settings

from learning_resources.constants import PlatformType
from learning_resources.etl import pipelines, youtube
from learning_resources.etl.edx_shared import (
    get_most_recent_course_archives,
    sync_edx_course_files,
)
from learning_resources.etl.utils import get_learning_course_bucket_name
from learning_resources.models import LearningResource
from learning_resources.utils import load_course_blocklist
from open_discussions.celery import app
from open_discussions.utils import chunks

log = logging.getLogger(__name__)


@app.task
def get_xpro_data():
    """Execute the xPro ETL pipeline"""
    pipelines.xpro_courses_etl()
    pipelines.xpro_programs_etl()


@app.task
def get_content_files(
    ids: list[int], platform: str, keys: list[str], s3_prefix: str | None = None
):
    """
    Task to sync edX course content files with database
    """
    if not (
        settings.AWS_ACCESS_KEY_ID
        and settings.AWS_SECRET_ACCESS_KEY
        and get_learning_course_bucket_name(platform) is not None
    ):
        log.warning("Required settings missing for %s files", platform)
        return
    sync_edx_course_files(platform, ids, keys, s3_prefix=s3_prefix)


def get_content_tasks(
    platform: str, chunk_size: int | None = None, s3_prefix: str | None = None
) -> celery.group:
    """
    Return a list of grouped celery tasks for indexing edx content
    """
    if chunk_size is None:
        chunk_size = settings.LEARNING_COURSE_ITERATOR_CHUNK_SIZE

    blocklisted_ids = load_course_blocklist()
    archive_keys = get_most_recent_course_archives(platform, s3_prefix=s3_prefix)
    return celery.group(
        [
            get_content_files.si(ids, platform, archive_keys, s3_prefix=s3_prefix)
            for ids in chunks(
                LearningResource.objects.filter(published=True, course__isnull=False)
                .filter(platform__platform=platform)
                .exclude(readable_id__in=blocklisted_ids)
                .order_by("-id")
                .values_list("id", flat=True),
                chunk_size=chunk_size,
            )
        ]
    )


@app.task(bind=True)
def import_all_xpro_files(self, chunk_size=None):
    """Ingest xPRO OLX files from an S3 bucket"""

    raise self.replace(
        get_content_tasks(
            PlatformType.xpro.value,
            chunk_size,
        )
    )


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
