"""Tests for mitpe_news"""

import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from news_events.etl.mitpe_events import extract, transform


@pytest.fixture()
def mitpe_events_settings(settings):
    """Assign the required MITPE settings"""
    settings.MITPE_BASE_API_URL = "https://api.example.com"
    return settings


@pytest.fixture()
def mitpe_events_json_data():
    """Return the raw content of the MITPE events json response"""
    with Path.open(Path("test_json/mitpe_events.json")) as in_file:
        return json.load(in_file)


@pytest.fixture(autouse=True)
def _mock_get_json(mocker, mitpe_events_json_data):
    """Return a dict for the MITPE events json response"""
    mock_get = mocker.patch("news_events.etl.mitpe_events.fetch_data_by_page")
    mock_get.side_effect = [mitpe_events_json_data, []]


def test_extract(mitpe_events_json_data, mitpe_events_settings):
    """Extract function should return raw json data for MITPE events"""
    assert extract() == mitpe_events_json_data


def test_transform(mitpe_events_json_data, mitpe_events_settings):
    """Assert that the transform function returns the expected data"""
    source_and_items = transform(extract())
    assert len(source_and_items) == 1
    source = source_and_items[0]
    items = source["items"]
    assert len(items) == 4
    assert (
        items[2]["title"]
        == "OnDemand Open House: Professional Certificate Program Design & Manufacturing"
    )
    assert items[0]["image"] == {
        "url": "https://professional.mit.edu/sites/default/files/2023-11/emtech%20mit%202023_0.jpeg",
        "alt": items[0]["title"],
        "description": items[0]["title"],
    }
    assert items[0]["summary"] == (
        "MIT Technology Review's flagship event on emerging technology and global trends."
    )
    assert items[0]["summary"] == items[0]["content"]
    assert items[0]["detail"]["event_datetime"] == datetime(
        2123, 11, 14, 13, 0, 0, tzinfo=UTC
    )
    assert items[0]["detail"]["event_end_datetime"] == datetime(
        2123, 11, 15, 21, 0, 0, tzinfo=UTC
    )
    assert items[1]["detail"]["event_datetime"] == datetime(
        2123, 4, 25, 16, 0, 0, tzinfo=UTC
    )
    assert items[1]["detail"]["event_end_datetime"] == datetime(
        2123, 4, 25, 17, 0, 0, tzinfo=UTC
    )
    assert items[2]["detail"]["event_datetime"] == datetime(
        2123, 5, 12, 4, 0, 0, tzinfo=UTC
    )
    assert items[2]["detail"]["event_end_datetime"] == datetime(
        2123, 5, 12, 4, 0, 0, tzinfo=UTC
    )
