"""Constants for learning_resources ETL processes"""

from collections import namedtuple
from enum import Enum

from django.conf import settings
from named_enum import ExtendedEnum

from learning_resources.constants import LearningResourceFormat

# A custom UA so that operators of OpenEdx will know who is pinging their service
COMMON_HEADERS = {
    "User-Agent": f"CourseCatalogBot/{settings.VERSION} ({settings.APP_BASE_URL})"
}

READABLE_ID_FIELD = "readable_id"

MIT_OWNER_KEYS = ["MITx", "MITx_PRO"]


OfferedByLoaderConfig = namedtuple(  # noqa: PYI024
    "OfferedByLoaderConfig", ["additive"], defaults=[False]
)
LearningResourceRunLoaderConfig = namedtuple(  # noqa: PYI024
    "RunLoaderConfig", ["offered_by"], defaults=[OfferedByLoaderConfig()]
)

CourseLoaderConfig = namedtuple(  # noqa: PYI024
    "CourseLoaderConfig",
    ["prune", "offered_by", "runs", "fetch_only"],
    defaults=[True, OfferedByLoaderConfig(), LearningResourceRunLoaderConfig(), False],
)

ProgramLoaderConfig = namedtuple(  # noqa: PYI024
    "ProgramLoaderConfig",
    ["prune", "courses", "offered_by", "runs"],
    defaults=[
        True,
        CourseLoaderConfig(),
        OfferedByLoaderConfig(),
        LearningResourceRunLoaderConfig(),
    ],
)


class ETLSource(Enum):
    """Enum of ETL sources"""

    micromasters = "micromasters"
    mit_edx = "mit_edx"
    mitxonline = "mitxonline"
    oll = "oll"
    xpro = "xpro"
    ocw = "ocw"
    prolearn = "prolearn"
    podcast = "podcast"
    see = "see"
    youtube = "youtube"


class CourseNumberType(Enum):
    """Enum of course number types"""

    primary = "primary"
    cross_listed = "cross-listed"


RESOURCE_FILE_ETL_SOURCES = [
    ETLSource.mit_edx.value,
    ETLSource.ocw.value,
    ETLSource.mitxonline.value,
    ETLSource.xpro.value,
]


RESOURCE_FORMAT_MAPPING = {
    None: LearningResourceFormat.online.name,
    "": LearningResourceFormat.online.name,
    "Blended": LearningResourceFormat.hybrid.name,
    "In Person": LearningResourceFormat.in_person.name,
    **{
        value: LearningResourceFormat(value).name
        for value in LearningResourceFormat.values()
    },
}


class ContentTagCategory(ExtendedEnum):
    """
    Enum for content tag categories.
    """

    videos = "Videos"
    notes = "Notes"
    exams_w_solutions = "Exams with Solutions"
    exams = "Exams"
    problem_sets_w_solutions = "Problem Sets with Solutions"
    problem_sets = "Problem Sets"
    assignments = "Assignments"


CONTENT_TAG_CATEGORIES = {
    "Lecture Videos": ContentTagCategory.videos.value,
    "Lecture Notes": ContentTagCategory.notes.value,
    "Exams with Solutions": ContentTagCategory.exams_w_solutions.value,
    "Exams": ContentTagCategory.exams.value,
    "Problem Sets with Solutions": (ContentTagCategory.problem_sets_w_solutions.value),
    "Problem Sets": ContentTagCategory.problem_sets.value,
    "Assignments": ContentTagCategory.assignments.value,
    # Can add more here if ever needed, in format tag_name:category
}
