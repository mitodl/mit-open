"""ETL pipelines"""
import logging
from datetime import datetime

import boto3
from django.conf import settings
from toolz import compose, curry

from learning_resources.constants import PlatformType
from learning_resources.etl import loaders, ocw, podcast, xpro

log = logging.getLogger(__name__)

load_programs = curry(loaders.load_programs)
load_courses = curry(loaders.load_courses)


xpro_programs_etl = compose(
    load_programs(PlatformType.xpro.value),
    xpro.transform_programs,
    xpro.extract_programs,
)
xpro_courses_etl = compose(
    load_courses(PlatformType.xpro.value),
    xpro.transform_courses,
    xpro.extract_courses,
)

podcast_etl = compose(loaders.load_podcasts, podcast.transform, podcast.extract)


def ocw_courses_etl(
    *,
    url_paths: list[str],
    force_overwrite: bool,
    start_timestamp: datetime | None = None
):
    """
    Sync OCW courses to the database

    Args:
        url_paths (list of str): The course url paths to process
        force_overwrite (bool): force incoming course data to overwrite existing data
        start_timestamp (datetime or None): backpopulate start time
    """
    s3_resource = boto3.resource(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    for url_path in url_paths:
        try:
            data = ocw.extract_course(
                url_path=url_path,
                s3_resource=s3_resource,
                force_overwrite=force_overwrite,
                start_timestamp=start_timestamp,
            )
            if data:
                ocw_course_data = ocw.transform_course(data)
                course_resource = loaders.load_course(ocw_course_data, [], [])
                if course_resource:
                    loaders.load_content_files(
                        course_resource.runs.filter(published=True).first(),
                        ocw.transform_content_files(
                            s3_resource, url_path, force_overwrite
                        ),
                    )
            else:
                log.info("No course data found for %s", url_path)
        except:  # noqa: E722
            log.exception("Error encountered parsing OCW json for %s", url_path)
