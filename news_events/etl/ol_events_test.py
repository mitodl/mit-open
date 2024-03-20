"""Tests for ol_events"""

import pytest
from bs4 import BeautifulSoup as Soup
from requests import HTTPError

from news_events.constants import FeedType
from news_events.etl import ol_events
from news_events.etl.ol_events import OL_EVENTS_URLS


@pytest.fixture(autouse=True)
def mock_get_index_soup(mocker, ol_events_html_data):
    return mocker.patch(
        "news_events.etl.ol_events.get_soup",
        side_effect=[Soup(html, "lxml") for html in ol_events_html_data],
    )


def test_extract():
    """Extract should return a list of expected BeautifulSoup objects with urls"""
    extracted = ol_events.extract()
    assert extracted[0][1] == ol_events.OL_EVENTS_URLS[0]
    index_soup = extracted[0][0]
    assert (
        index_soup.title.text
        == "Attend an event hosted by MIT Open Learning | Open Learning"
    )


def test_extract_bad_data(mocker):
    """HTTP errors during processing should be logged"""
    mock_log = mocker.patch("news_events.etl.ol_events.log.exception")
    mocker.patch(
        "news_events.etl.ol_events.get_soup",
        side_effect=[HTTPError("HTTP Error 404: Not Found")],
    )
    extracted = ol_events.extract()
    assert len(extracted) == 0
    mock_log.assert_called_once_with("Error fetching source url %s", OL_EVENTS_URLS[0])


def test_transform():
    """Transform should return expected JSON"""
    extracted = ol_events.extract()
    sources = ol_events.transform(extracted)
    assert len(sources) == 1
    source = sources[0]
    assert source["url"] == "https://openlearning.mit.edu/events"
    assert (
        source["title"] == "Attend an event hosted by MIT Open Learning | Open Learning"
    )
    assert source["feed_type"] == FeedType.events.name
    assert source["description"].startswith(
        "MIT Open Learning hosts a variety of events"
    )
    assert len(source["items"]) == 2


@pytest.mark.parametrize(
    ("item_html", "page_html", "expected"),
    [
        (
            "<div class='event-start'>March 15, 2024 9:00 AM</div>",
            "<span class='date-display-range'>April 15 2025 10 AM</span>",
            "2025-04-15T14:00:00Z",
        ),
        (
            "<div class='event-start'>March 15, 2024 9:00 AM</div>",
            "<span class>2025-04-15 12 PM</span>",
            "2024-03-15T13:00:00Z",
        ),
        ("<div>2024-03-15</div>", "<span>2025-04-15</span>", None),
    ],
)
def test_parse_event_date(item_html, page_html, expected):
    """parse_event_date should return the expected date"""
    item_data = Soup(item_html, "lxml") if item_html else None
    page_data = Soup(page_html, "lxml") if page_html else None
    assert ol_events.parse_event_date(item_data, page_data) == expected


@pytest.mark.parametrize(
    ("html", "expected"),
    [
        ('<div class="field--name-body">Faculty</div>', "Faculty"),
        ('<div class="field--name-header">MIT Community</div>', None),
    ],
)
def test_transform_event_content(html, expected):
    """transform_content should return the expected content"""
    content_soup = Soup(html, "lxml")
    assert ol_events.transform_event_content(content_soup) == expected
