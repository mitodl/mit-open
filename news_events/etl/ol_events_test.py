"""Tests for ol_events"""

import datetime
import json
from pathlib import Path

import pytest

from news_events.etl import ol_events


@pytest.fixture()
def mock_get_json_data(mocker, ol_events_json_data):
    """Mock requests.get to return json data"""
    return mocker.patch(
        "news_events.etl.utils.requests.get",
        side_effect=[
            mocker.Mock(json=mocker.Mock(return_value=json_data))
            for json_data in ol_events_json_data
        ],
    )


@pytest.fixture()
def expected_event():
    """Return the expected event data"""
    with Path.open(Path("test_json/ol_events_output.json")) as in_file:
        return json.load(in_file)


def test_extract(ol_events_json_data, mock_get_json_data):
    """Extract should return an expected dict object"""
    assert ol_events.extract() == ol_events_json_data[0]


def test_transform(mock_get_json_data, ol_events_json_data, expected_event):
    """Transform should return expected JSON"""
    expected_event["detail"]["event_datetime"] = datetime.datetime.strptime(
        expected_event["detail"]["event_datetime"], "%Y-%m-%dT%H:%M:%SZ"
    ).replace(tzinfo=datetime.UTC)
    extracted = ol_events.extract()
    assert extracted == ol_events_json_data[0]
    sources = ol_events.transform(extracted)
    assert len(sources) == 1
    source = sources[0]
    assert source["items"] == [expected_event]


def transform_event_expired(ol_events_json_data):
    """Transform should not return old events"""
    item_data = ol_events_json_data[0]
    item_data["attributes"]["field_event_date"]["value"] = "1999-12-31T23:59:59Z"
    assert ol_events.transform_event(item_data) is None


def test_extract_image_data_missing_text_url(ol_events_json_data):
    """extract_event_image should return expected result when missing image text metadata url"""
    image_data = ol_events_json_data[0]["data"][0]["relationships"]["field_event_image"]
    image_data["links"]["related"]["href"] = None
    assert ol_events.extract_event_image(image_data) == ({}, {})


def test_extract_image_data_missing_src_url(mocker, ol_events_json_data):
    """extract_event_image should return expected result when missing image src metadata url"""
    image_data = ol_events_json_data[0]["data"][0]["relationships"]["field_event_image"]
    image_text_metadata = ol_events_json_data[1]
    image_text_metadata["data"]["relationships"]["field_media_image"]["links"][
        "related"
    ]["href"] = None
    mocker.patch(
        "news_events.etl.utils.requests.get",
        side_effect=[mocker.Mock(json=mocker.Mock(return_value=image_text_metadata))],
    )
    assert ol_events.extract_event_image(image_data) == (ol_events_json_data[1], {})


@pytest.mark.parametrize("null_src_meta", [True, False])
def test_transform_event_image_missing_data(null_src_meta, ol_events_json_data):
    """transform_event_image should return expected result when missing metadata"""
    image_text_metadata = {}
    image_src_metadata = {} if null_src_meta else ol_events_json_data[2]
    image = ol_events.transform_event_image(image_text_metadata, image_src_metadata)
    if null_src_meta:
        assert image is None
    else:
        assert image == {
            "url": "https://openlearning.mit.edu/sites/default/files/event-images/DEDP-Banner-webinar-2024.jpg",
            "description": None,
            "alt": None,
        }
