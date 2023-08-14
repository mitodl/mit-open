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
    # uncomment the following as models are added
    # video = "video"
    # podcast = "podcast"
    # podcast_episode = "podcast_episode"
    # staff_list = "stafflist"
