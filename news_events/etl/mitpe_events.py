"""ETL functions for MIT Professional Education events data."""

import html
import logging
from datetime import UTC, time
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import dateparser
from django.conf import settings

from main.utils import now_in_utc
from news_events.constants import ALL_AUDIENCES, FeedType
from news_events.etl.utils import fetch_data_by_page, parse_date

log = logging.getLogger(__name__)
MITPE_EVENTS_TITLE = "MIT Professional Education Events"
MITPE_EVENTS_DESCRIPTION = """
MIT Professional Education events.
"""


def extract() -> list[dict]:
    """
    Extract data from the MITPE news API.

    Returns:
        list[dict]: News data in JSON format.
    """
    if settings.MITPE_BASE_API_URL:
        return list(
            fetch_data_by_page(urljoin(settings.MITPE_BASE_API_URL, "/feeds/events/"))
        )
    else:
        log.warning("Missing required setting MITPE_BASE_API_URL")

    return []


def transform_image(news_dict: dict) -> dict:
    """
    Transform the image from the MIT Professional Education news API.

    Args:
        news_dict (dict): extracted news item data

    Returns:
        dict: transformed news item image data

    """
    if news_dict.get("image"):
        return {
            "url": urljoin(settings.MITPE_BASE_URL, news_dict["image"]),
            "alt": news_dict.get("title"),
            "description": news_dict.get("title"),
        }
    return {}


def parse_time_range(time_range_str: str) -> tuple[time or None]:
    """
    Attempt to parse the time range from the MITPE events API.
    The field might not actually contain a time or range.

    Args:
        time_range (str): time range string

    Returns:
        tuple: start and end times as strings

    """
    start_time = None
    end_time = None
    zone = ZoneInfo("US/Eastern")
    times = time_range_str.split("-")
    if len(times) == 2:  # noqa: PLR2004
        end_dt = dateparser.parse(times[1])
        if end_dt:
            zone = end_dt.tzinfo or zone
            end_time = end_dt.replace(tzinfo=zone).astimezone(UTC).time()
    start_dt = dateparser.parse(times[0])
    if start_dt:
        start_time = start_dt.replace(tzinfo=zone).astimezone(UTC).time()

    return start_time, end_time


def transform_item(item: dict) -> dict:
    """
    Transform the items from the MIT Professional Education news API.

    Args:
        item (dict): extracted event data

    Returns:
        dict: transformed event data

    """
    time_start, time_end = parse_time_range(item.get("time_range"))
    start_dt = parse_date(item.get("start_date"))
    if start_dt and time_start:
        start_dt = start_dt.replace(hour=time_start.hour, minute=time_start.minute)
    end_dt = parse_date(item.get("end_date")) or start_dt
    if end_dt and time_end:
        end_dt = end_dt.replace(hour=time_end.hour, minute=time_end.minute)

    # Do not bother transforming past events
    now = now_in_utc()
    if (not start_dt or start_dt < now) and (not end_dt or end_dt < now):
        return None

    return {
        "guid": item["id"],
        "title": html.unescape(item["title"]),
        "url": urljoin(settings.MITPE_BASE_URL, item["url"]),
        "summary": html.unescape(item["summary"]),
        "content": html.unescape(item["summary"]),
        "image": transform_image(item),
        "detail": {
            "location": [],
            "audience": ALL_AUDIENCES,
            "event_type": [],
            "event_datetime": start_dt,
            "event_end_datetime": end_dt,
        },
    }


def transform_items(events_data: list[dict]) -> list[dict]:
    """
    Transform the items from the MIT Professional Education events API.

    Args:
        events_data (list of dict): list of extracted events data

    Returns:
        list of dict: list of transformed events items data

    """
    return [transform_item(item) for item in events_data]


def transform(events_data: list[dict]) -> list[dict]:
    """
    Transform the data from the MIT Professional Education news api.

    Args:
        events_data (list of dict): list of extracted news data

    Returns:
        list of dict: list of transformed news source/items data

    """

    return [
        {
            "title": MITPE_EVENTS_TITLE,
            "url": urljoin(settings.MITPE_BASE_URL, "/events"),
            "feed_type": FeedType.events.name,
            "description": MITPE_EVENTS_DESCRIPTION,
            "items": [item for item in transform_items(events_data) if item],
        }
    ]
