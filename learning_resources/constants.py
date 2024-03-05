"""Constants for learning_resources"""


from django.db.models import TextChoices
from named_enum import ExtendedEnum

FAVORITES_TITLE = "Favorites"


class AvailabilityType(ExtendedEnum):
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


class LearningResourceType(ExtendedEnum):
    """Enum for LearningResource resource_type values"""

    course = "Course"
    program = "Program"
    learning_path = "Learning Path"
    podcast = "Podcast"
    podcast_episode = "Podcast Episode"
    video = "Video"
    video_playlist = "Video Playlist"


class OfferedBy(ExtendedEnum):
    """
    Enum for our Offered By labels. They are our MIT "brands" for LearningResources
    (Courses, Bootcamps, Programs) and are independent of what platform.
    User generated lists UserLists (like a learning path) don't have offered by "brand".
    Values are user-facing.
    These should be kept in sync with the LearningResourceOfferor model objects
    """

    mitx = "MITx"
    ocw = "OCW"
    bootcamps = "Bootcamps"
    xpro = "xPRO"
    csail = "CSAIL"
    mitpe = "Professional Education"
    see = "Sloan Executive Education"
    scc = "Schwarzman College of Computing"
    ctl = "Center for Transportation & Logistics"


class PlatformType(ExtendedEnum):
    """
    Enum for platforms, this should be kept in sync
    with LearningResourcePlatform model objects
    """

    edx = "edX"
    ocw = "OCW"
    oll = "Open Learning Library"
    mitxonline = "MITx Online"
    bootcamps = "Bootcamps"
    xpro = "xPRO"
    csail = "CSAIL"
    mitpe = "Professional Education"
    see = "Sloan Executive Education"
    scc = "Schwarzman College of Computing"
    ctl = "Center for Transportation & Logistics"
    whu = "WHU"
    susskind = "Susskind"
    globalalumni = "Global Alumni"
    simplilearn = "Simplilearn"
    emeritus = "Emeritus"
    podcast = "Podcast"
    youtube = "YouTube"


class PrivacyLevel(ExtendedEnum):
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
    PLAYLIST_VIDEOS = "PLAYLIST_VIDEOS", "Playlist Videos"


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

DEPARTMENTS = {
    "1": "Civil and Environmental Engineering",
    "2": "Mechanical Engineering",
    "3": "Materials Science and Engineering",
    "4": "Architecture",
    "5": "Chemistry",
    "6": "Electrical Engineering and Computer Science",
    "7": "Biology",
    "8": "Physics",
    "9": "Brain and Cognitive Sciences",
    "10": "Chemical Engineering",
    "11": "Urban Studies and Planning",
    "12": "Earth, Atmospheric, and Planetary Sciences",
    "14": "Economics",
    "15": "Sloan School of Management",
    "16": "Aeronautics and Astronautics",
    "17": "Political Science",
    "18": "Mathematics",
    "20": "Biological Engineering",
    "21A": "Anthropology",
    "21G": "Global Studies and Languages",
    "21H": "History",
    "21L": "Literature",
    "21M": "Music and Theater Arts",
    "22": "Nuclear Science and Engineering",
    "24": "Linguistics and Philosophy",
    "CC": "Concourse",
    "CMS-W": "Comparative Media Studies/Writing",
    "EC": "Edgerton Center",
    "ES": "Experimental Study Group",
    "ESD": "Engineering Systems Division",
    "HST": "Health Sciences and Technology",
    "IDS": "Institute for Data, Systems, and Society",
    "MAS": "Media Arts and Sciences",
    "PE": "Athletics, Physical Education and Recreation",
    "RES": "Supplemental Resources",
    "STS": "Science, Technology, and Society",
    "WGS": "Women's and Gender Studies",
}


LEARNING_RESOURCE_SORTBY_OPTIONS = {
    "id": {
        "title": "Object ID ascending",
        "sort": "id",
    },
    "-id": {
        "title": "Object ID descending",
        "sort": "-id",
    },
    "readable_id": {
        "title": "Readable ID ascending",
        "sort": "readable_id",
    },
    "-readable_id": {
        "title": "Readable ID descending",
        "sort": "-readable_id",
    },
    "last_modified": {
        "title": "Last Modified Date ascending",
        "sort": "last_modified",
    },
    "-last_modified": {
        "title": "Last Modified Date descending",
        "sort": "-last_modified",
    },
    "created_on": {
        "title": "Creation Date ascending",
        "sort": "created_on",
    },
    "-created_on": {
        "title": "CreationDate descending",
        "sort": "-created_on",
    },
    "start_date": {
        "title": "Start Date ascending",
        "sort": "runs__start_date",
    },
    "-start_date": {
        "title": "Start Date descending",
        "sort": "-runs__start_date",
    },
    "mitcoursenumber": {
        "title": "MIT course number ascending",
        "sort": "course__course_numbers__0__sort_coursenum",
    },
    "-mitcoursenumber": {
        "title": "MIT course number descending",
        "sort": "-course__course_numbers__0__sort_coursenum",
    },
}


class LevelType(ExtendedEnum):
    """
    Enum for resource (run) level.
    """

    undergraduate = "Undergraduate"
    graduate = "Graduate"
    high_school = "High School"
    noncredit = "Non-Credit"
    advanced = "Advanced"
    intermediate = "Intermediate"
    introductory = "Introductory"
