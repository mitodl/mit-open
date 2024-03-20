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
    """Extract data from the Open Learning Events pages."""
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
    """Parse the event date from the Open Learning Event data."""
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
    """Extract data from the Open Learning Events page for a given HTML page div"""
    items_div = page_data.find("div", class_=class_name)
    item_values = [
        tag_text(item)
        for item in items_div.find_all("div", class_="field__item")
        if (items_div and item)
    ]
    return [item_value for item_value in item_values if item_value]


def extract_event(event_data) -> Soup:
    """Extract data from the Open Learning Event url."""
    url = urljoin(OL_EVENTS_BASE_URL, event_data.find("a").attrs["href"])
    return get_soup(url)


def transform_event_content(event_page_data: Soup) -> str:
    """Transform the Open Learning Event content."""
    return event_page_data.find("div", class_="field--name-body").text.strip()


def transform_event(event_data: Soup, event_page_data: Soup) -> dict:
    """Transform the Open Learning Event data."""
    return {
        "guid": event_data.find("a").attrs["href"],
        "url": urljoin(OL_EVENTS_BASE_URL, event_data.find("a").attrs["href"]),
        "title": tag_text(event_data.find("h4")),
        "item_date": parse_event_date(event_data, event_page_data),
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


def transform_events(events_data: list[Soup]) -> list:
    """Transform the Open Learning Events items data."""
    return [
        transform_event(event, extract_event(event))
        for event in events_data
        if events_data
    ]


def transform(sources_data: list[tuple[Soup, str]]) -> list:
    """Transform the Open Learning Events source data."""
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
