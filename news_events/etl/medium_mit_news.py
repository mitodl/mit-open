"""ETL functions for MIT News data."""

import feedparser

from news_events.constants import FeedType
from news_events.etl.utils import stringify_time_struct

# Just one url for now
MEDIUM_MIT_NEWS_URLS = ["https://medium.com/feed/open-learning"]


def extract() -> list[tuple[dict, str]]:
    """
    Extract data from the MIT News RSS feed.

    Returns:
        list[tuple[dict, str]]: List of source data and url tuples.
    """
    return [(feedparser.parse(url), url) for url in MEDIUM_MIT_NEWS_URLS]


def transform_topics(tags: list) -> list[dict]:
    """
    Transform the topics from the MIT News RSS feed.

    Args:
        tags (list): list of tags

    Returns:
        list: list of topic data dicts
    """
    return sorted([tag.get("term") for tag in tags if tag.get("term")])


def transform_items(items_data: list[dict]) -> list[dict]:
    """
    Transform the items from the MIT News RSS feed.

    Args:
        items_data (list): list of extracted items

    Returns:
        list of dict: list of transformed items
    """
    return [
        {
            "guid": item.get("id"),
            "title": item.get("title", ""),
            "url": item.get("link", None),
            "summary": item.get("summary", ""),
            "content": (item.get("content") or [{}])[0].get("value", ""),
            # This RSS does not include images for news items
            "image": None,
            "detail": {
                "authors": [
                    author["name"] for author in item.get("authors", []) if author
                ],
                "topics": transform_topics(item.get("tags", [])),
                "publish_date": stringify_time_struct(item.get("published_parsed")),
            },
        }
        for item in items_data
    ]


def transform_image(image_data: dict) -> dict:
    """
    Transform the image from the MIT News RSS feed.

    Args:
        image_data (dict): image data

    Returns:
        dict: transformed image data
    """
    return {
        "url": image_data.get("url"),
        "description": image_data.get("title"),
        "alt": image_data.get("title"),
    }


def transform(sources_data: list[tuple[dict, str]]) -> list[dict]:
    """
    Transform the data from the MIT News RSS feed.

    Args:
        sources_data (list of tuples): list of extracted data and source url tuples

    Returns:
        list of dict: list of transformed sources data

    """
    return [
        {
            "title": source_data["feed"].get("title", ""),
            "url": url,
            "feed_type": FeedType.news.name,
            "description": source_data["feed"].get("subtitle", ""),
            "items": transform_items(source_data["entries"]),
            "image": transform_image(source_data["feed"].get("image", {})),
        }
        for (source_data, url) in sources_data
    ]
