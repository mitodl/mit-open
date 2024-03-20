"""ETL functions for Open Learning Events data."""

import logging
from urllib.parse import urljoin

import pytz
from bs4 import BeautifulSoup as Soup
from dateutil import parser
from requests import HTTPError

from main.constants import ISOFORMAT
from news_events.constants import FeedType
from news_events.etl.utils import get_soup, safe_html, tag_text

log = logging.getLogger(__name__)

OL_EVENTS_BASE_URL = "https://openlearning.mit.edu/"

# One URL for now, might switch to a list of audience/type-specific URLs later
OL_EVENTS_URLS = ["/events"]


def extract() -> list[tuple[Soup, str]]:
    """
    Extract data from the Open Learning Events pages.

    Returns:
        list[tuple[Soup, str]]: List of source data and the source url tuples.
    """
    sources = []
    for url in OL_EVENTS_URLS:
        try:
            soup = get_soup(urljoin(OL_EVENTS_BASE_URL, url))
        except HTTPError:
            log.exception("Error fetching source url %s", url)
            continue
        sources.append((soup, url))
    return sources


def parse_event_date(event_data: Soup, event_page_data: Soup) -> str:
    """
    Parse the event date from the Open Learning Event data.

    Args:
        event_data (Soup): The event data BeautifulSoup object
        event_page_data (Soup): The event page data BeautifulSoup object

    Returns:
        str: The event date in ISO format
    """
    item_date = tag_text(event_data.find("div", class_="event-start"))
    page_date = tag_text(event_page_data.find("span", class_="date-display-range"))
    if not item_date and not page_date:
        return None
    dt = (
        pytz.timezone("US/Eastern")
        .localize(parser.parse(page_date or item_date))
        .astimezone(pytz.utc)
    )
    return dt.strftime(ISOFORMAT)


def transform_items(page_data: Soup, class_name: str) -> list[str]:
    """
    Extract text from the Open Learning Events page for a given HTML page div"

    Args:
        page_data (Soup): The page data BeautifulSoup object
        class_name (str): The class name of the div to extract

    Returns:
        list[str]: List of extracted element text
    """
    items_div = page_data.find("div", class_=class_name)
    item_values = [
        tag_text(item)
        for item in items_div.find_all("div", class_="field__item")
        if (items_div and item)
    ]
    return [item_value for item_value in item_values if item_value]


def extract_event(event_data: Soup) -> Soup:
    """
    Extract data from the linked event url.

    Args:
        event_data (Soup): The event data BeautifulSoup object

    Returns
        Soup: The event BeautifulSoup object from the event url
    """
    url = urljoin(OL_EVENTS_BASE_URL, event_data.find("a").attrs["href"])
    return get_soup(url) if url else None


def transform_event_content(event_page_data: Soup) -> str:
    """
    Get the text for the Open Learning Event element.

    Args:
        event_page_data (Soup): The event element BeautifulSoup object

    Returns:
        str: The event element text

    """
    return tag_text(event_page_data.find("div", class_="field--name-body"))


def transform_event_image(event_data: Soup) -> dict:
    """
    Get the image url for the Open Learning Event.

    Args:
        event_data (Soup): The event data BeautifulSoup object

    Returns:
        dict: The event image url
    """
    image_div = event_data.find("div", class_="field--name-field-event-image")
    if image_div:
        img = image_div.find("img")
        if img:
            return {
                "url": urljoin(OL_EVENTS_BASE_URL, img.attrs["src"]),
                "alt": img.attrs["alt"],
                "description": img.attrs["alt"],
            }
    return None


def transform_event(event_data: Soup, event_page_data: Soup) -> dict:
    """
    Transform the Open Learning Event data.

    Args:
        event_data (Soup): The event item data BeautifulSoup object
        event_page_data (Soup): The event page data BeautifulSoup object

    Returns:
        dict: The transformed event data
    """
    return {
        "guid": event_data.find("a").attrs["href"],
        "url": urljoin(OL_EVENTS_BASE_URL, event_data.find("a").attrs["href"]),
        "title": tag_text(event_data.find("h4")),
        "item_date": parse_event_date(event_data, event_page_data),
        "image": transform_event_image(event_data),
        "summary": tag_text(
            event_page_data.find("div", class_="field--type-text-with-summary")
        ),
        "content": safe_html(
            event_page_data.find("div", class_="field--type-text-with-summary")
        ),
        "detail": {
            "location": transform_items(
                event_page_data, "field--name-field-location-tag"
            ),
            "audience": transform_items(
                event_page_data, "field--name-field-event-audience"
            ),
            "event_type": transform_items(
                event_page_data, "field--name-field-event-category"
            ),
        },
    }


def transform_events(events_data: list[Soup]) -> list[dict]:
    """
    Transform the Open Learning Events items data.

    Args:
        events_data (list): List of event data BeautifulSoup objects

    Returns:
        list of dict: List of transformed events data
    """
    return [
        transform_event(event, extract_event(event))
        for event in events_data
        if events_data
    ]


def transform(sources_data: list[tuple[Soup, str]]) -> list[dict]:
    """
    Transform the Open Learning Events source data.

    Args:
        sources_data (list): List of source data BeautifulSoup object and url tuples

    Returns:
        list of dict: List of transformed sources data

    """
    return [
        {
            "title": tag_text(source_data.title),
            "url": urljoin(OL_EVENTS_BASE_URL, url),
            "feed_type": FeedType.events.name,
            "description": source_data.find(
                "meta", attrs={"name": "description"}
            ).attrs.get("content", ""),
            "items": transform_events(
                source_data.find("div", class_="item-list").find_all("article")
            ),
        }
        for source_data, url in sources_data
        if sources_data
    ]
