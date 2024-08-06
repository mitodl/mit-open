"""Tests for mitpe_news"""

import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from news_events.etl.mitpe_news import extract, transform


@pytest.fixture()
def mitpe_news_settings(settings):
    """Assign the required MITPE settings"""
    settings.MITPE_BASE_API_URL = "https://api.example.com"
    return settings


@pytest.fixture()
def mitpe_news_json_data():
    """Return the raw content of the MITPE news json response"""
    with Path.open(Path("test_json/mitpe_news.json")) as in_file:
        return json.load(in_file)


@pytest.fixture(autouse=True)
def _mock_get_json(mocker, mitpe_news_json_data):
    """Return a dict for the MITPE news json response"""
    mock_get = mocker.patch("news_events.etl.mitpe_news.fetch_data_by_page")
    mock_get.side_effect = [mitpe_news_json_data, []]


def test_extract(settings, mitpe_news_json_data, mitpe_news_settings):
    """Extract function should return raw json data for MITPE news"""
    assert extract() == mitpe_news_json_data


def test_transform(mitpe_news_json_data, mitpe_news_settings):
    """Assert that the transform function returns the expected data"""
    source_and_items = transform(extract())
    assert len(source_and_items) == 1
    source = source_and_items[0]
    items = source["items"]
    assert len(items) == 4
    assert (
        items[0]["title"]
        == "Powering Product Innovation: Q&A with MIT's Erdin Beshimov"
    )
    assert items[0]["detail"]["authors"] == ["Ms. Asha Rivers", "Dr. Steven B. Goldman"]
    assert items[1]["detail"]["authors"] == [
        "Kate S. Petersen",
        "School of Engineering",
    ]
    assert items[2]["detail"]["authors"] == ["Vivienne Sze"]
    assert items[3]["detail"]["authors"] == []
    assert (
        items[0]["url"]
        == "https://professional.mit.edu/news/articles/powering-product-innovation-qa-mits-erdin-beshimov"
    )
    assert items[0]["image"] == {
        "url": "https://professional.mit.edu/sites/default/files/2023-04/171108.jpg",
        "alt": items[0]["title"],
        "description": items[0]["title"],
    }
    assert items[0]["summary"].startswith(
        "Discover how Erdin Beshimov, a lecturer at MIT & Senior"
    )
    assert items[0]["summary"] == items[0]["content"]
    assert items[0]["detail"]["publish_date"] == datetime(
        2023, 4, 4, 4, 0, 0, tzinfo=UTC
    )
