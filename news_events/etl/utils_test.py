"""Tests for utils functions"""

from time import struct_time

import pytest

from news_events.etl import utils


@pytest.fixture(autouse=True)
def _mock_requests_get(mocker, ol_events_html_data):
    mocker.patch(
        "news_events.etl.utils.requests.get",
        return_value=mocker.Mock(content=ol_events_html_data[0]),
    )


def test_get_soup():
    """get_soup should return a BeautifulSoup object with expected info"""
    soup = utils.get_soup("https://test.mit.edu/events")
    assert (
        soup.title.text == "Attend an event hosted by MIT Open Learning | Open Learning"
    )


def test_tag_text():
    """tag_text should return the text from a BeautifulSoup tag"""
    soup = utils.get_soup("https://test.mit.edu/events")
    assert (
        utils.tag_text(soup.title)
        == "Attend an event hosted by MIT Open Learning | Open Learning"
    )


def test_safe_html():
    """safe_html should return the html from a tag with no forbidden elements"""
    soup = utils.get_soup("https://test.mit.edu/events")
    initial_html = str(soup)
    clean_html = utils.safe_html(soup)
    for element in ["<script", "style=", "class="]:
        assert element in initial_html
        assert element not in clean_html


@pytest.mark.parametrize(
    ("time_struct", "expected"),
    [
        (struct_time([2024, 3, 15, 13, 42, 36, 0, 74, 0]), "2024-03-15T13:42:36Z"),
        (struct_time([24, 5, 15, 13, 42, 36, 0, 74, -4]), "2024-05-15T17:42:36Z"),
        (None, None),
    ],
)
def test_stringify_time_struct(time_struct, expected):
    """stringify_time_struct should return an ISO formatted date string"""
    assert utils.stringify_time_struct(time_struct) == expected
