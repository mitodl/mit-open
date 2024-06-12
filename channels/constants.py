"""Constants for channels"""

from named_enum import ExtendedEnum

FIELD_ROLE_MODERATORS = "moderators"
FIELD_ROLE_CHOICES = (FIELD_ROLE_MODERATORS,)  # Just moderators for now


class ChannelType(ExtendedEnum):
    """
    Enum for channel types.
    """

    topic = "Topic"
    department = "Department"
    unit = "Unit"
    pathway = "Pathway"
