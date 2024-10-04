"""Constants for learning_resources ETL processes"""

from collections import namedtuple
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum

from django.conf import settings
from named_enum import ExtendedEnum

from learning_resources.constants import LearningResourceDelivery

# A custom UA so that operators of OpenEdx will know who is pinging their service
COMMON_HEADERS = {
    "User-Agent": f"CourseCatalogBot/{settings.VERSION} ({settings.APP_BASE_URL})"
}

READABLE_ID_FIELD = "readable_id"

MIT_OWNER_KEYS = ["MITx", "MITx_PRO"]

TIME_INTERVAL_MAPPING = {
    "half-days": ["days"],
    "half-day": ["day"],
    "hours": [
        "horas",
    ],
    "hour": [
        "hora",
    ],
    "days": [
        "días",
    ],
    "day": [
        "día",
    ],
    "weeks": [
        "semanas",
    ],
    "week": [
        "semana",
    ],
    "months": [
        "meses",
    ],
    "month": [
        "mes",
    ],
}


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


class ETLSource(ExtendedEnum):
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


RESOURCE_DELIVERY_MAPPING = {
    None: LearningResourceDelivery.online.name,
    "": LearningResourceDelivery.online.name,
    "Blended": LearningResourceDelivery.hybrid.name,
    "In Person": LearningResourceDelivery.in_person.name,
    **{
        value: LearningResourceDelivery(value).name
        for value in LearningResourceDelivery.values()
    },
}


class ContentTagCategory(ExtendedEnum):
    """
    Enum for content tag categories.
    """

    videos = "Videos"
    notes = "Notes"
    exams = "Exams"
    problem_sets = "Problem Sets"


CONTENT_TAG_CATEGORIES = {
    "Lecture Videos": ContentTagCategory.videos.value,
    "Lecture Notes": ContentTagCategory.notes.value,
    "Exams with Solutions": ContentTagCategory.exams.value,
    "Exams": ContentTagCategory.exams.value,
    "Problem Sets with Solutions": ContentTagCategory.problem_sets.value,
    "Problem Sets": ContentTagCategory.problem_sets.value,
    "Assignments": ContentTagCategory.problem_sets.value,
    # Can add more here if ever needed, in format tag_name:category
}


@dataclass
class ResourceNextRunConfig:
    next_start_date: datetime = None
    prices: list[Decimal] = field(default_factory=list)
    availability: str = None
    duration: str = None
    time_commitment: str = None


@dataclass
class DurationConfig:
    duration: str = ""
    min_weeks: int = None
    max_weeks: int = None


@dataclass
class CommitmentConfig:
    commitment: str = ""
    min_hours: int = None
    max_hours: int = None
