"""Constants for news_events"""

from named_enum import ExtendedEnum


class FeedType(ExtendedEnum):
    """
    Enum for feed types
    """

    news = "News"
    events = "Events"
