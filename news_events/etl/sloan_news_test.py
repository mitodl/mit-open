"""Tests for Sloan blog ETL"""

from pathlib import Path

import pytest
from bs4 import BeautifulSoup as Soup

from news_events.constants import FeedType
from news_events.etl import sloan_news


@pytest.fixture()
def sloan_blog_html_data():
    """Return the content of the Sloan blog html file"""
    with Path.open(Path("test_html/test_sloan_news.html")) as in_file:
        return in_file.read()


@pytest.fixture(autouse=True)
def mock_index_soup(mocker, sloan_blog_html_data):
    """Return a BeautifulSoup object for the Sloan blog html file"""
    return mocker.patch(
        "news_events.etl.sloan_news.get_soup",
        return_value=Soup(sloan_blog_html_data, "lxml"),
    )


def test_extract():
    """Extract function should return BeautifulSoup object for Sloan blog"""
    index_soup = sloan_news.extract()
    assert index_soup.title.text == "Blog - MIT Sloan Teaching & Learning Technologies"


def test_transform():
    """Test transform function"""
    transformed_data = sloan_news.transform(sloan_news.extract())
    assert len(transformed_data) == 1
    source = transformed_data[0]
    assert source["url"] == sloan_news.SLOAN_BLOG_URL
    assert source["title"] == "Blog - MIT Sloan Teaching & Learning Technologies"
    assert source["feed_type"] == FeedType.news.name
    assert source["description"].startswith("The official blog for MIT Sloan Teaching")
    assert len(source["items"]) == 10
    assert source["items"][0]["detail"]["publish_date"] == "2024-03-06T00:00:00Z"
    assert source["items"][0]["title"].startswith("Supporting Learning")
    assert (
        source["items"][0]["url"]
        == "https://mitsloanedtech.mit.edu/2024/03/06/supporting-learning-with-ai-generated-images-a-research-backed-guide/"
    )
    assert source["items"][3]["detail"]["topics"] == [
        "AI",
        "AI Use Cases",
        "ChatGPT",
        "Faculty Spotlight",
    ]
