"""Constants for course catalog ETL processes"""
from collections import namedtuple

from django.conf import settings

# A custom UA so that operators of OpenEdx will know who is pinging their service
COMMON_HEADERS = {
    "User-Agent": f"CourseCatalogBot/{settings.VERSION} ({settings.SITE_BASE_URL})"
}


OfferedByLoaderConfig = namedtuple(  # noqa: PYI024
    "OfferedByLoaderConfig", ["additive"], defaults=[False]
)
LearningResourceRunLoaderConfig = namedtuple(  # noqa: PYI024
    "RunLoaderConfig", ["offered_by"], defaults=[OfferedByLoaderConfig()]
)

CourseLoaderConfig = namedtuple(  # noqa: PYI024
    "CourseLoaderConfig",
    ["prune", "offered_by", "runs"],
    defaults=[True, OfferedByLoaderConfig(), LearningResourceRunLoaderConfig()],
)

ProgramLoaderConfig = namedtuple(  # noqa: PYI024
    "ProgramLoaderConfig",
    ["courses", "offered_by", "runs"],
    defaults=[
        CourseLoaderConfig(),
        OfferedByLoaderConfig(),
        LearningResourceRunLoaderConfig(),
    ],
)

PodcastEpisodeLoaderConfig = namedtuple(  # noqa: PYI024
    "PodcastEpisodeLoaderConfig",
    ["offered_by", "runs"],
    defaults=[OfferedByLoaderConfig(), LearningResourceRunLoaderConfig()],
)

PodcastLoaderConfig = namedtuple(  # noqa: PYI024
    "PodcastLoaderConfig",
    ["episodes", "offered_by", "runs"],
    defaults=[
        PodcastEpisodeLoaderConfig(),
        OfferedByLoaderConfig(),
        LearningResourceRunLoaderConfig(),
    ],
)

VideoLoaderConfig = namedtuple(  # noqa: PYI024
    "VideoLoaderConfig",
    ["offered_by", "runs"],
    defaults=[OfferedByLoaderConfig(), LearningResourceRunLoaderConfig()],
)

PlaylistLoaderConfig = namedtuple(  # noqa: PYI024
    "PlaylistLoaderConfig",
    ["offered_by", "videos"],
    defaults=[OfferedByLoaderConfig(), VideoLoaderConfig()],
)
