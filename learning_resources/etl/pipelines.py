"""ETL pipelines"""
from typing import List

from toolz import compose, curry, curried

from learning_resources.etl import (
    loaders,
    xpro,
)

from learning_resources.constants import PlatformType
from learning_resources.models import Program, Course


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
