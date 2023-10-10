"""Constants for learning_resources ETL processes"""
from collections import namedtuple

CourseLoaderConfig = namedtuple(  # noqa: PYI024
    "CourseLoaderConfig",
    ["prune"],
    defaults=[True],
)

ProgramLoaderConfig = namedtuple(  # noqa: PYI024
    "ProgramLoaderConfig",
    ["prune", "courses"],
    defaults=[True, CourseLoaderConfig()],
)
