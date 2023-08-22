"""Constants for course catalog ETL processes"""
from collections import namedtuple

from django.conf import settings


OfferedByLoaderConfig = namedtuple(
    "OfferedByLoaderConfig", ["additive"], defaults=[False]
)

CourseLoaderConfig = namedtuple(
    "CourseLoaderConfig",
    ["prune", "offered_by"],
    defaults=[True, OfferedByLoaderConfig()],
)

ProgramLoaderConfig = namedtuple(
    "ProgramLoaderConfig",
    ["prune", "courses", "offered_by"],
    defaults=[True, CourseLoaderConfig(), OfferedByLoaderConfig()],
)

PodcastEpisodeLoaderConfig = namedtuple(
    "PodcastEpisodeLoaderConfig",
    ["offered_by"],
    defaults=[OfferedByLoaderConfig()],
)

PodcastLoaderConfig = namedtuple(
    "PodcastLoaderConfig",
    ["episodes", "offered_by"],
    defaults=[
        PodcastEpisodeLoaderConfig(),
        OfferedByLoaderConfig(),
    ],
)

VideoLoaderConfig = namedtuple(
    "VideoLoaderConfig",
    ["offered_by"],
    defaults=[OfferedByLoaderConfig()],
)

PlaylistLoaderConfig = namedtuple(
    "PlaylistLoaderConfig",
    ["offered_by", "videos"],
    defaults=[OfferedByLoaderConfig(), VideoLoaderConfig()],
)
