"""Tests for ol_events"""

import pytest
from bs4 import BeautifulSoup as Soup

from news_events.constants import FeedType
from news_events.etl import ol_events


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
