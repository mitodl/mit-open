"""ETL pipelines"""

import logging
from datetime import datetime

import boto3
from django.conf import settings
from toolz import compose, curry

from learning_resources.etl import (
    loaders,
    micromasters,
    mit_edx,
    mitxonline,
    ocw,
    oll,
    podcast,
    posthog,
    prolearn,
    sloan,
    xpro,
    youtube,
)
from learning_resources.etl.constants import (
    CourseLoaderConfig,
    ETLSource,
    ProgramLoaderConfig,
)
from learning_resources.etl.exceptions import ExtractException

log = logging.getLogger(__name__)

load_programs = curry(loaders.load_programs)
load_courses = curry(loaders.load_courses)

micromasters_etl = compose(
    load_programs(
        ETLSource.micromasters.name,
        config=ProgramLoaderConfig(
            prune=True, courses=CourseLoaderConfig(fetch_only=True)
        ),
    ),
    micromasters.transform,
    micromasters.extract,
)

mit_edx_etl = compose(
    load_courses(
        ETLSource.mit_edx.name,
        config=CourseLoaderConfig(prune=True),
    ),
    mit_edx.transform,
    mit_edx.extract,
)

mitxonline_programs_etl = compose(
    load_programs(
        ETLSource.mitxonline.name,
        config=ProgramLoaderConfig(
            courses=CourseLoaderConfig(fetch_only=True), prune=True
        ),
    ),
    mitxonline.transform_programs,
    mitxonline.extract_programs,
)
mitxonline_courses_etl = compose(
    load_courses(ETLSource.mitxonline.name, config=CourseLoaderConfig(prune=True)),
    mitxonline.transform_courses,
    mitxonline.extract_courses,
)

oll_etl = compose(
    load_courses(ETLSource.oll.name, config=CourseLoaderConfig(prune=True)),
    oll.transform,
    oll.extract,
)


prolearn_programs_etl = compose(
    load_programs(
        ETLSource.prolearn.name,
        config=ProgramLoaderConfig(courses=CourseLoaderConfig(fetch_only=True)),
    ),
    prolearn.transform_programs,
    prolearn.extract_programs,
)


prolearn_courses_etl = compose(
    load_courses(ETLSource.prolearn.name, config=CourseLoaderConfig(prune=True)),
    prolearn.transform_courses,
    prolearn.extract_courses,
)


sloan_courses_etl = compose(
    load_courses(ETLSource.see.name, config=CourseLoaderConfig(prune=True)),
    sloan.transform_courses,
    sloan.extract,
)


xpro_programs_etl = compose(
    load_programs(
        ETLSource.xpro.name,
        config=ProgramLoaderConfig(
            courses=CourseLoaderConfig(fetch_only=True), prune=True
        ),
    ),
    xpro.transform_programs,
    xpro.extract_programs,
)
xpro_courses_etl = compose(
    load_courses(ETLSource.xpro.name, config=CourseLoaderConfig(prune=True)),
    xpro.transform_courses,
    xpro.extract_courses,
)

podcast_etl = compose(loaders.load_podcasts, podcast.transform, podcast.extract)


def ocw_courses_etl(
    *,
    url_paths: list[str],
    force_overwrite: bool,
    start_timestamp: datetime | None = None,
    skip_content_files: bool = settings.OCW_SKIP_CONTENT_FILES,
):
    """
    Sync OCW courses to the database

    Args:
        url_paths (list of str): The course url paths to process
        force_overwrite (bool): force incoming course data to overwrite existing data
        start_timestamp (datetime or None): backpopulate start time
        skip_content_files (bool): skip loading content files
    """
    s3_resource = boto3.resource(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    exceptions = []
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
                if course_resource and not skip_content_files:
                    loaders.load_content_files(
                        course_resource.runs.filter(published=True).first(),
                        ocw.transform_content_files(
                            s3_resource, url_path, force_overwrite
                        ),
                        calc_completeness=True,
                    )
            else:
                log.info("No course data found for %s", url_path)
        except:  # noqa: E722
            log.exception("Error encountered parsing OCW json for %s", url_path)
            exceptions.append(url_path)
    if exceptions:
        message = "Some OCW urls raised errors: {exception}".format(
            exception=",".join(exceptions)
        )
        raise ExtractException(message)


youtube_etl = compose(loaders.load_video_channels, youtube.transform, youtube.extract)

posthog_etl = compose(
    posthog.load_posthog_lrd_view_events,
    posthog.posthog_transform_lrd_view_events,
    posthog.posthog_extract_lrd_view_events,
)
