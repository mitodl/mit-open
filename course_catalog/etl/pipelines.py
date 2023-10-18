"""ETL pipelines"""

from toolz import compose, curry

from course_catalog.constants import PlatformType
from course_catalog.etl import (
    loaders,
    micromasters,
    prolearn,
    video,
    youtube,
)
from course_catalog.etl.constants import (
    CourseLoaderConfig,
    LearningResourceRunLoaderConfig,
    OfferedByLoaderConfig,
    ProgramLoaderConfig,
)
from course_catalog.models import Course, Program

# A few notes on how this module works:
#
# - Each pipeline is composed right-to-left
# - We define normalized loaders of data in loaders.py
# - Each integration must define an extraction function to fetch the data
# - Each integration must define an transformation function to normalize the data
# - Additional specifics are commented on as needed

load_programs = curry(loaders.load_programs)
load_courses = curry(loaders.load_courses)

micromasters_etl = compose(
    load_programs(
        PlatformType.micromasters.value,
        # MicroMasters courses overlap with MITx, so configure course and run level offerors to be additive  # noqa: E501
        config=ProgramLoaderConfig(
            courses=CourseLoaderConfig(
                offered_by=OfferedByLoaderConfig(additive=True),
                runs=LearningResourceRunLoaderConfig(
                    offered_by=OfferedByLoaderConfig(additive=True)
                ),
            )
        ),
    ),
    micromasters.transform,
    micromasters.extract,
)


youtube_etl = compose(loaders.load_video_channels, youtube.transform, youtube.extract)

# pipeline for generating topic data for videos based on course topics
video_topics_etl = compose(loaders.load_videos, video.extract_videos_topics)


def prolearn_programs_etl() -> list[Program]:
    """Iterate through all supported prolearn platforms to import programs"""
    results = []
    for platform in prolearn.PROLEARN_DEPARTMENT_MAPPING:
        platform_func = compose(
            load_programs(platform),
            prolearn.transform_programs,
            prolearn.extract_programs,
        )
        results.extend(platform_func(platform))
    return results


def prolearn_courses_etl() -> list[Course]:
    """Iterate through all supported prolearn platforms to import courses"""
    results = []
    for platform in prolearn.PROLEARN_DEPARTMENT_MAPPING:
        platform_func = compose(
            load_courses(platform),
            prolearn.transform_courses,
            prolearn.extract_courses,
        )
        results.extend(platform_func(platform))
    return results
