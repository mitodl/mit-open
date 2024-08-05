"""ETL functions for Open Learning Events data."""

import logging
from datetime import UTC
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

from dateutil import parser

from main.utils import clean_data, now_in_utc
from news_events.constants import FeedType
from news_events.etl.utils import get_request_json

log = logging.getLogger(__name__)
OL_EVENTS_BASE_URL = "https://openlearning.mit.edu/"
OL_EVENTS_SOURCE_URL = urljoin(OL_EVENTS_BASE_URL, "/events/")
OL_EVENTS_TITLE = "Open Learning Events"
# Copied from OL_EVENTS_BASE_URL html page
OL_EVENTS_DESCRIPTION = """
Open Learning hosts a wide range of events for learners, educators, researchers,
nd practitioners around the world.
Regular event series include Open Learning Talks, which bring together leaders
to discuss research-based ideas, technologies, and efforts in education; and xTalks,
which provide MIT faculty, researchers, staff, and students an opportunity to share
their experiences developing and using digital technologies in the classroom.
Explore upcoming events below, including webinars, workshops, and more.
"""

# One URL for now, might switch to a list of audience/type-specific URLs later
OL_EVENTS_API_URL = (
    "https://openlearning.mit.edu/jsonapi/node/event?sort=-field_event_date.value"
)


def extract() -> dict:
    """
    Extract data from the Open Learning Events API.

    Returns:
        dict: Source data in JSON format.
    """
    return get_request_json(OL_EVENTS_API_URL)


def extract_relationship(event_data: dict, relation: str) -> dict:
    """
    Extract data from the specified Open Learning Event relationship.

    Args:
        event_data (dict): The event data
        relation (str): The relationship to extract

    Returns:
        list[dict]: List of extracted relationship data
    """
    relation_url = (
        event_data.get("relationships", {})
        .get(relation, {})
        .get("links", {})
        .get("related", {})
        .get("href")
    )
    return get_request_json(relation_url) if relation_url else {}


def transform_relationship(relation_data: dict) -> list[str]:
    """
    Transform the Open Learning Event relationship data.

    Args:
        relation_data (dict): The relationship data

    Returns:
        list[str]: List of relationship values

    """
    return [
        relation.get("attributes", {}).get("name")
        for relation in relation_data.get("data", [])
    ]


def extract_event_image(image_data: dict) -> tuple[dict, dict]:
    """
    Extract the image data from the Open Learning Event.

    Args:
        image_data (dict): The image data

    Returns:
        tuple[dict, dict]: The image text metadata and image source metadata

    """
    img_text_url = image_data.get("links", {}).get("related", {}).get("href")
    if not img_text_url:
        return {}, {}
    img_text_metadata = get_request_json(img_text_url)
    next_url = (
        img_text_metadata.get("data", {})
        .get("relationships", {})
        .get("field_media_image", {})
        .get("links", {})
        .get("related", {})
        .get("href")
    )
    if not next_url:
        return img_text_metadata, {}
    img_src_metadata = get_request_json(next_url) if next_url else {}
    return img_text_metadata, img_src_metadata


def transform_event_image(image_text_metadata: dict, image_src_metadata: dict) -> dict:
    """
    Get the image url for the Open Learning Event image.

    Args:
        image_text_metadata (dict): The image metadata containing alt/title info
        image_src_metadata(dict): The image metadata containing the image url

    Returns:
        dict: The transformed event image info
    """
    image_src = (
        image_src_metadata.get("data", {})
        .get("attributes", {})
        .get("uri", {})
        .get("url")
    )
    attrs = (
        image_text_metadata.get("data", {})
        .get("relationships", {})
        .get("field_media_image", {})
        .get("data", {})
        .get("meta", {})
    )
    if image_src:
        return {
            "url": urljoin(OL_EVENTS_BASE_URL, image_src),
            "alt": attrs.get("alt"),
            "description": attrs.get("title"),
        }
    return None


def transform_event(event_data: dict) -> dict or None:
    """
    Transform the Open Learning Event data.

    Args:
        event_data (dict): The event item data

    Returns:
        dict: The transformed event data
    """
    attributes = event_data.get("attributes", {})
    event_path = attributes.get("path", {}).get("alias", "")
    dt = attributes.get("field_event_date", {}).get("value")
    dt_utc = (
        parser.parse(dt).replace(tzinfo=ZoneInfo("US/Eastern")).astimezone(UTC)
        if dt
        else None
    )
    if dt_utc < now_in_utc():
        return None

    return {
        "guid": event_data["id"],
        "url": urljoin(OL_EVENTS_BASE_URL, event_path) if event_path else None,
        "title": attributes.get("title"),
        "image": transform_event_image(
            *extract_event_image(
                event_data.get("relationships", {}).get("field_event_image", {})
            )
        ),
        "summary": clean_data(attributes.get("body", {}).get("value") or ""),
        "content": clean_data(attributes.get("body", {}).get("value") or ""),
        "detail": {
            "location": transform_relationship(
                extract_relationship(event_data, "field_location_tag")
            ),
            "audience": transform_relationship(
                extract_relationship(event_data, "field_event_audience")
            ),
            "event_type": transform_relationship(
                extract_relationship(event_data, "field_event_category")
            ),
            "event_datetime": dt_utc,
            "event_end_datetime": dt_utc,
        },
    }


def transform_events(events_data: list[dict]) -> list[dict]:
    """
    Transform the Open Learning Events items data.

    Args:
        events_data (list): List of event data BeautifulSoup objects

    Returns:
        list of dict: List of transformed events data
    """
    return [
        event
        for event in [transform_event(event) for event in events_data if events_data]
        if event
    ]


def transform(source_data: dict) -> list[dict]:
    """
    Transform the Open Learning Events source data.

    Args:
        source_data (dict): Data from the Open Learning Events API

    Returns:
        list of dict: List of transformed source data

    """
    return (
        [
            {
                "title": OL_EVENTS_TITLE,
                "url": OL_EVENTS_SOURCE_URL,
                "feed_type": FeedType.events.name,
                "description": OL_EVENTS_DESCRIPTION,
                "items": transform_events(source_data["data"]),
            }
        ]
        if source_data
        else []
    )
