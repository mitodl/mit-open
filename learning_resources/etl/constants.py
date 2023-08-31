"""Constants for course catalog ETL processes"""  # noqa: INP001
from collections import namedtuple

OfferedByLoaderConfig = namedtuple(  # noqa: PYI024
    "OfferedByLoaderConfig", ["additive"], defaults=[False]
)

CourseLoaderConfig = namedtuple(  # noqa: PYI024
    "CourseLoaderConfig",
    ["prune", "offered_by"],
    defaults=[True, OfferedByLoaderConfig()],
)

ProgramLoaderConfig = namedtuple(  # noqa: PYI024
    "ProgramLoaderConfig",
    ["prune", "courses", "offered_by"],
    defaults=[True, CourseLoaderConfig(), OfferedByLoaderConfig()],
)

PodcastEpisodeLoaderConfig = namedtuple(  # noqa: PYI024
    "PodcastEpisodeLoaderConfig",
    ["offered_by"],
    defaults=[OfferedByLoaderConfig()],
)

PodcastLoaderConfig = namedtuple(  # noqa: PYI024
    "PodcastLoaderConfig",
    ["episodes", "offered_by"],
    defaults=[
        PodcastEpisodeLoaderConfig(),
        OfferedByLoaderConfig(),
    ],
)

VideoLoaderConfig = namedtuple(  # noqa: PYI024
    "VideoLoaderConfig",
    ["offered_by"],
    defaults=[OfferedByLoaderConfig()],
)

PlaylistLoaderConfig = namedtuple(  # noqa: PYI024
    "PlaylistLoaderConfig",
    ["offered_by", "videos"],
    defaults=[OfferedByLoaderConfig(), VideoLoaderConfig()],
)
