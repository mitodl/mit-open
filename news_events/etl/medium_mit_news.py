"""ETL functions for MIT News data."""

import feedparser

from news_events.constants import FeedType
from news_events.etl.utils import stringify_time_struct

# Just one url for now
MEDIUM_MIT_NEWS_URLS = ["https://medium.com/feed/open-learning"]


def extract() -> list[tuple[dict, str]]:
    """Extract data from the MIT News RSS feed."""
    return [(feedparser.parse(url), url) for url in MEDIUM_MIT_NEWS_URLS]


def transform_topics(tags: list) -> list:
    """Transform the topics from the MIT News RSS feed."""
    return [
        {
            "url": "",
            "code": tag.get("term"),
            "name": tag.get("term").replace("-", " ").title(),
        }
        for tag in tags
        if tag.get("term")
    ]


def transform_items(items_data: list) -> list:
    """Transform the items from the MIT News RSS feed."""
    return [
        {
            "guid": item.get("id"),
            "title": item.get("title", ""),
            "url": item.get("link", None),
            "summary": item.get("summary", ""),
            "content": (item.get("content") or [{}])[0].get("value", ""),
            "item_date": stringify_time_struct(item.get("published_parsed")),
            # This RSS does not include images for news items
            "image": None,
            "detail": {
                "authors": [
                    author["name"] for author in item.get("authors", []) if author
                ],
            },
            "topics": transform_topics(item.get("tags", [])),
        }
        for item in items_data
    ]


def transform(sources_data: list[tuple[dict, str]]) -> list[dict]:
    """Transform the data from the MIT News RSS feed."""
    return [
        {
            "title": source_data["feed"].get("title", ""),
            "url": url,
            "feed_type": FeedType.news.name,
            "description": source_data["feed"].get("subtitle", ""),
            "items": transform_items(source_data["entries"]),
        }
        for (source_data, url) in sources_data
    ]
