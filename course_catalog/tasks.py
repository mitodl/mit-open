"""
course_catalog tasks
"""
import logging

import boto3
import celery
import rapidjson
from celery import Task
from django.conf import settings

from course_catalog.constants import PlatformType
from course_catalog.etl import pipelines, youtube
from course_catalog.etl.edx_shared import (
    get_most_recent_course_archives,
    sync_edx_course_files,
)
from course_catalog.etl.utils import get_learning_course_bucket_name
from course_catalog.models import Course
from course_catalog.utils import load_course_blocklist
from open_discussions.celery import app
from open_discussions.utils import chunks

log = logging.getLogger(__name__)


@app.task
def get_mitx_data():
    """Task to sync mitx data with the database"""
    pipelines.mitx_etl()


def get_content_tasks(
    platform: str, chunk_size: int | None = None, s3_prefix: str | None = None
) -> list[Task]:
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
                Course.objects.filter(published=True)
                .filter(platform=platform)
                .exclude(course_id__in=blocklisted_ids)
                .order_by("-id")
                .values_list("id", flat=True),
                chunk_size=chunk_size,
            )
        ]
    )


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


@app.task(bind=True)
def import_all_mitxonline_files(self, chunk_size=None):
    """Ingest MITx Online files from an S3 bucket"""
    raise self.replace(
        get_content_tasks(
            PlatformType.mitxonline.value,
            chunk_size,
        )
    )


@app.task(bind=True)
def import_all_mitx_files(self, chunk_size=None):
    """Ingest MITx files from an S3 bucket"""
    raise self.replace(
        get_content_tasks(
            PlatformType.mitx.value,
            chunk_size,
            s3_prefix=settings.EDX_LEARNING_COURSE_BUCKET_PREFIX,
        )
    )


@app.task
def upload_ocw_parsed_json():
    """
    Task to upload all OCW Course master json data to S3
    """
    s3_bucket = boto3.resource(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    ).Bucket(settings.OCW_LEARNING_COURSE_BUCKET_NAME)

    for course in Course.objects.filter(platform=PlatformType.ocw.value).iterator(
        chunk_size=settings.OCW_ITERATOR_CHUNK_SIZE
    ):
        # Approximate course_prefix from course.url
        course_url = course.url
        if course_url[-1] == "/":
            course_url = course_url[:-1]
        s3_folder = course_url.split("/")[-1]

        s3_bucket.put_object(
            Key=s3_folder + f"/{course.course_id}_parsed.json",
            Body=rapidjson.dumps(course.raw_json),
            ACL="private",
        )


@app.task
def get_micromasters_data():
    """Execute the MicroMasters ETL pipeline"""
    pipelines.micromasters_etl()


@app.task
def get_xpro_data():
    """Execute the xPro ETL pipeline"""
    pipelines.xpro_courses_etl()
    pipelines.xpro_programs_etl()


@app.task
def get_mitxonline_data():
    """Execute the MITX Online ETL pipeline"""
    pipelines.mitxonline_courses_etl()
    pipelines.mitxonline_programs_etl()


@app.task
def get_oll_data():
    """Execute the OLL ETL pipeline"""
    pipelines.oll_etl()


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


@app.task
def get_podcast_data():
    """
    Execute the Podcast ETL pipeline

    Returns:
        int:
            The number of results that were fetched
    """
    results = pipelines.podcast_etl()

    return len(list(results))
