"""Constants for learning_resources"""

from enum import Enum

from django.db.models import TextChoices

OPEN = "Open Content"
PROFESSIONAL = "Professional Offerings"
CERTIFICATE = "Certificates"


class AvailabilityType(Enum):
    """
    Enum for Course availability options dictated by edX API values.
    While these are the options coming in from edX that we store as is, we
    display some values differently. Namely "Current" is displayed to the user
    as "Available Now" and "Archived" is displayed as "Prior".
    As of 06/21/2019, the above mapping occurs in `learning_resources.js:availabilityLabel()`.
    All OCW courses should be set to "Current".
    """  # noqa: E501

    current = "Current"  # displayed as "Available Now"
    upcoming = "Upcoming"
    starting_soon = "Starting Soon"
    archived = "Archived"  # displayed as "Prior"


class LearningResourceType(Enum):
    """Enum for LearningResource resource_type values"""

    course = "course"
    program = "program"
    learning_path = "learning_path"
    # uncomment the following as models are added


class OfferedBy(Enum):
    """
    Enum for our Offered By labels. They are our MIT "brands" for LearningResources
    (Courses, Bootcamps, Programs) and are independent of what platform.
    User generated lists UserLists (like a learning path) don't have offered by "brand".
    Values are user-facing.
    """

    mitx = "MITx"
    ocw = "OCW"
    micromasters = "MicroMasters"
    bootcamps = "Bootcamps"
    xpro = "xPRO"
    oll = "Open Learning Library"
    csail = "CSAIL"
    mitpe = "Professional Education"
    see = "Sloan Executive Education"
    scc = "Schwarzman College of Computing"
    ctl = "Center for Transportation & Logistics"


class PlatformType(Enum):
    """
    Enum for platforms
    """

    ocw = "ocw"
    mitx = "mitx"
    mitxonline = "mitxonline"
    micromasters = "micromasters"
    bootcamps = "bootcamps"
    xpro = "xpro"
    oll = "oll"
    youtube = "youtube"
    podcast = "podcast"
    csail = "csail"
    mitpe = "mitpe"
    see = "see"
    scc = "scc"
    ctl = "ctl"


class PrivacyLevel(Enum):
    """
    Enum tracking privacy levels for user-created UserLists
    """

    private = "private"
    unlisted = "unlisted"


semester_mapping = {"1T": "spring", "2T": "summer", "3T": "fall"}


class LearningResourceRelationTypes(TextChoices):
    """Enum for LearningResourceRelationship relation_type values"""

    PROGRAM_COURSES = "PROGRAM_COURSES", "Program Courses"
    LEARNING_PATH_ITEMS = "LEARNING_PATH_ITEMS", "Learning Path Items"
    PODCAST_EPISODES = "PODCAST_EPISODES", "Podcast Episodes"


GROUP_STAFF_LISTS_EDITORS = "learning_path_editors"

VALID_TEXT_FILE_TYPES = [
    ".csv",
    ".doc",
    ".docx",
    ".htm",
    ".html",
    ".json",
    ".m",
    ".mat",
    ".md",
    ".pdf",
    ".ppt",
    ".pptx",
    ".ps",
    ".py",
    ".r",
    ".rtf",
    ".sjson",
    ".srt",
    ".txt",
    ".vtt",
    ".xls",
    ".xlsx",
    ".xml",
]


CONTENT_TYPE_PAGE = "page"
CONTENT_TYPE_FILE = "file"
CONTENT_TYPE_VIDEO = "video"
CONTENT_TYPE_PDF = "pdf"


CONTENT_TYPE_VERTICAL = "vertical"
VALID_COURSE_CONTENT_TYPES = (
    CONTENT_TYPE_PAGE,
    CONTENT_TYPE_FILE,
    CONTENT_TYPE_VERTICAL,
)
VALID_COURSE_CONTENT_CHOICES = list(
    zip(VALID_COURSE_CONTENT_TYPES, VALID_COURSE_CONTENT_TYPES)
)
