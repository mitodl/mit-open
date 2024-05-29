"""Constants for learning_resources ETL processes"""

from collections import namedtuple
from enum import Enum

from django.conf import settings

from learning_resources.constants import LearningResourceFormat

# A custom UA so that operators of OpenEdx will know who is pinging their service
COMMON_HEADERS = {
    "User-Agent": f"CourseCatalogBot/{settings.VERSION} ({settings.SITE_BASE_URL})"
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
    ["prune", "offered_by", "runs"],
    defaults=[True, OfferedByLoaderConfig(), LearningResourceRunLoaderConfig()],
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
    **{
        value: LearningResourceFormat(value).name
        for value in LearningResourceFormat.values()
    },
}


ALLOWED_HTML_TAGS = {
    "b",
    "blockquote",
    "br",
    "caption",
    "center",
    "cite",
    "code",
    "div",
    "em",
    "hr",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "q",
    "small",
    "span",
    "strike",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
}

ALLOWED_HTML_ATTRIBUTES = {}
