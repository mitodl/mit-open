"""Constants for learning_resources"""

from enum import Enum

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
    """

    current = "Current"  # displayed as "Available Now"
    upcoming = "Upcoming"
    starting_soon = "Starting Soon"
    archived = "Archived"  # displayed as "Prior"


class LearningResourceType(Enum):
    """Enum for LearningResource resource_type values"""

    program = "program"
    course = "course"
    video = "video"
    podcast = "podcast"
    podcast_episode = "podcast_episode"
    staff_list = "stafflist"


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


EDX_PLATFORMS = [
    platform.value
    for platform in (
        PlatformType.mitx,
        PlatformType.mitxonline,
        PlatformType.xpro,
        PlatformType.oll,
    )
]

RESOURCE_FILE_PLATFORMS = [PlatformType.ocw.value, *EDX_PLATFORMS]
