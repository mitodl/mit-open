"""Tests for sloan_webinars"""

import datetime
import json
from pathlib import Path

import pytest

from news_events.etl import sloan_webinars


@pytest.fixture()
def sloan_webinars_json_data():
    json_files = [
        "test_json/sloan_webinars_output.json",
    ]
    json_data = []
    for json_file in json_files:
        with Path.open(Path(json_file)) as in_file:
            json_data.append(json.load(in_file))
    return json_data


@pytest.fixture()
def mock_get_json_data(mocker, sloan_webinars_json_data):
    """Mock requests.get to return json data"""
    return mocker.patch(
        "news_events.etl.utils.requests.get",
        side_effect=[
            mocker.Mock(json=mocker.Mock(return_value=json_data))
            for json_data in sloan_webinars_json_data
        ],
    )


@pytest.fixture(autouse=True)
def _mock_post_json(mocker, sloan_webinars_json_data):
    """Return a dict for the Sloan blog json response"""
    mock_session = mocker.patch("news_events.etl.sloan_exec_news.requests.Session")
    mock_session.return_value.get.return_value = mocker.Mock(
        content="fwuid%22%3A%22ABC%22\nsiteforce%3AcommunityApp%22%3A%22DEF%22"
    )
    mock_session.return_value.post.return_value.json.return_value = (
        sloan_webinars_json_data
    )


@pytest.fixture()
def expected_event():
    """Return the expected event data"""
    with Path.open(Path("test_json/sloan_webinars_output.json")) as in_file:
        return json.load(in_file)


def test_extract(sloan_webinars_json_data, mock_get_json_data):
    """Extract should return an expected dict object"""
    assert sloan_webinars.extract() == sloan_webinars_json_data


def test_transform(mock_get_json_data, sloan_webinars_json_data, expected_event):
    """Transform should return expected JSON"""
    expected_event["publishedDate"] = datetime.datetime.strptime(
        expected_event["publishedDate"], "%Y-%m-%dT%H:%M:%S.%fZ"
    ).replace(tzinfo=datetime.UTC)
    extracted = sloan_webinars.extract()
    assert extracted == sloan_webinars_json_data
    sources = sloan_webinars.transform(extracted)
    assert len(sources) == 1


def transform_event_expired(sloan_webinars_json_data):
    """Transform should not return old events"""
    item_data = sloan_webinars_json_data
    item_data["attributes"]["field_event_date"]["value"] = "1999-12-31T23:59:59Z"
    assert sloan_webinars.transform_event(item_data) is None


@pytest.mark.parametrize("null_src_meta", [True, False])
def test_transform_event_image_missing_data(null_src_meta, sloan_webinars_json_data):
    """transform_event_image should return expected result when missing metadata"""
    image_src_metadata = (
        {}
        if null_src_meta
        else sloan_webinars_json_data[0]["contentNodes"]["Card_Image"]
    )
    image = sloan_webinars.extract_event_image(image_src_metadata)
    if null_src_meta:
        assert image is None
    else:
        assert image == {
            "url": "https://exec.mit.edu/cms/delivery/media/MC5WOBGPJSGBH55HH6UH74G3HM6Q",
            "alt": "Coming Soon",
            "description": "Coming Soon",
        }
