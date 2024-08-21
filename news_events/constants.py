"""Constants for news_events"""

from named_enum import ExtendedEnum


class FeedType(ExtendedEnum):
    """
    Enum for feed types
    """

    news = "News"
    events = "Events"


NEWS_EVENTS_SORTBY_OPTIONS = {
    "id": {
        "title": "Object ID ascending",
        "sort": "id",
    },
    "-id": {
        "title": "Object ID descending",
        "sort": "-id",
    },
    "event_date": {
        "title": "Event date ascending",
        "sort": "event_details__event_datetime",
    },
    "-event_date": {
        "title": "Event date  descending",
        "sort": "-event_details__event_datetime",
    },
    "created": {
        "title": "Creation date ascending",
        "sort": "created_on",
    },
    "-created": {
        "title": "Creation date descending",
        "sort": "-created_on",
    },
}


ALL_AUDIENCES = ["Faculty", "MIT Community", "Public", "Students"]
