"""Tests for MIT news from Medium RSS feed"""

import feedparser
import pytest

from news_events.constants import FeedType
from news_events.etl import medium_mit_news
from news_events.etl.utils import stringify_time_struct


@pytest.fixture()
def medium_mit_rss_data():
    """Medium MIT News RSS fixture"""
    return feedparser.parse("test_html/test_medium_mit_news.rss")


@pytest.fixture(autouse=True)
def mock_feedparser(mocker, medium_mit_rss_data):
    return mocker.patch(
        "news_events.etl.medium_mit_news.feedparser.parse",
        return_value=medium_mit_rss_data,
    )


def test_extract(medium_mit_rss_data, mock_feedparser):
    """Tests extraction of of data from  RSS feeds"""
    assert medium_mit_news.extract() == [
        (medium_mit_rss_data, url) for url in medium_mit_news.MEDIUM_MIT_NEWS_URLS
    ]
    for url in medium_mit_news.MEDIUM_MIT_NEWS_URLS:
        mock_feedparser.assert_any_call(url)


def test_transform(mocker, medium_mit_rss_data):
    """Transform should return JSON with expected data"""
    transformed_data = medium_mit_news.transform(medium_mit_news.extract())
    assert len(transformed_data) == 1
    source_data = transformed_data[0]
    feed_source = medium_mit_rss_data["feed"]
    feed_items = medium_mit_rss_data["entries"]
    items = source_data.pop("items")
    assert source_data == {
        "title": feed_source["title"],
        "url": medium_mit_news.MEDIUM_MIT_NEWS_URLS[0],
        "feed_type": FeedType.news.name,
        "description": feed_source["description"],
        "image": {
            "url": feed_source["image"]["url"],
            "description": feed_source["image"]["title"],
            "alt": feed_source["image"]["title"],
        },
    }
    for idx, item in enumerate(items):
        assert item["title"] == feed_items[idx]["title"]
        assert item["url"] == feed_items[idx]["link"]
        assert item["guid"] == feed_items[idx]["id"]
        if item["image"]:
            assert item["image"]["url"] in feed_items[idx]["content"][0]["value"]
            assert item["image"]["alt"] in feed_items[idx]["content"][0]["value"]
        assert item["detail"]["publish_date"] == stringify_time_struct(
            feed_items[idx]["published_parsed"]
        )


def test_transform_items(mocker, medium_mit_rss_data):
    """transform_items should return JSON with expected data"""
    item_rss_data = medium_mit_rss_data["entries"]
    transformed_items = medium_mit_news.transform_items(item_rss_data)
    assert len(transformed_items) == 3
    assert transformed_items[0] == {
        "guid": "https://medium.com/p/a685e2b89c6a",
        "title": "Meet 8 MIT women faculty who teach MITx courses and lead cutting-edge research",
        "url": "https://medium.com/open-learning/meet-8-mit-women-faculty",
        "summary": "Celebrating Women\u2019s History Month with MIT women\u2019s truncated",
        "content": "Celebrating Women\u2019s History Month with MIT women\u2019s truncated",
        "image": None,
        "detail": {
            "authors": ["MIT Open Learning"],
            "publish_date": "2024-03-15T13:42:36Z",
            "topics": [
                "education",
                "mit",
                "ol-news",
                "online-learning",
                "womens-history-month",
            ],
        },
    }
