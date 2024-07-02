"""Tests for MIT Sloan Executive Education news ETL pipeline"""

import json
from pathlib import Path

import pytest

from news_events.constants import FeedType
from news_events.etl import sloan_exec_news


@pytest.fixture()
def sloan_blog_json_data():
    """Return the raw content of the Sloan blog json response"""
    with Path.open(Path("test_json/test_sloan_exec_news.json")) as in_file:
        return json.load(in_file)


@pytest.fixture(autouse=True)
def _mock_post_json(mocker, sloan_blog_json_data):
    """Return a dict for the Sloan blog json response"""
    mock_session = mocker.patch("news_events.etl.sloan_exec_news.requests.Session")
    mock_session.return_value.get.return_value = mocker.Mock(
        content="fwuid%22%3A%22ABC%22\nsiteforce%3AcommunityApp%22%3A%22DEF%22"
    )
    mock_session.return_value.post.return_value.json.return_value = sloan_blog_json_data


def test_extract(sloan_blog_json_data):
    """Extract function should return BeautifulSoup object for Sloan blog"""
    assert sloan_exec_news.extract() == sloan_blog_json_data


def test_transform():
    """Test transform function"""
    transformed_data = sloan_exec_news.transform(sloan_exec_news.extract())
    assert len(transformed_data) == 1
    source = transformed_data[0]
    assert source["url"] == sloan_exec_news.SLOAN_EXEC_BLOG_URL
    assert source["title"] == sloan_exec_news.SLOAN_EXEC_TITLE
    assert source["description"] == sloan_exec_news.SLOAN_EXEC_TITLE
    assert source["feed_type"] == FeedType.news.name
    items = list(source["items"])
    assert len(items) == 20
    assert items[0]["detail"]["publish_date"] == "2024-03-25T16:29:25.000Z"
    assert items[0]["title"] == "Cybersecurity Resiliency is More Than Protection"
    assert (
        items[0]["url"]
        == "https://exec.mit.edu/s/blog-post/cybersecurity-resiliency-is-more-than-protection-20YU1000004rCaMMAU"
    )
    assert items[3]["detail"]["topics"] == [
        "Organizations & Leadership",
        "Trending Blog Posts",
    ]


def test_transform_no_posts(mocker):
    """Test that an error is logged if no post data is found"""
    mock_log = mocker.patch("news_events.etl.sloan_exec_news.log.error")
    data = sloan_exec_news.extract()
    data.pop("actions")
    transformed_data = sloan_exec_news.transform(data)
    assert len(list(transformed_data[0]["items"])) == 0
    mock_log.assert_called_once_with("No posts found in the Sloan blog source data")
