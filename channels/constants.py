"""Constants for channels"""

from named_enum import ExtendedEnum

CHANNEL_ROLE_MODERATORS = "moderators"
CHANNEL_ROLE_CHOICES = (CHANNEL_ROLE_MODERATORS,)  # Just moderators for now


class ChannelType(ExtendedEnum):
    """
    Enum for channel types.
    """

    topic = "Topic"
    department = "Department"
    unit = "Unit"
    pathway = "Pathway"
