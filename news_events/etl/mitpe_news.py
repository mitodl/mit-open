"""ETL functions for MIT professional Education news data."""

import html
import logging
from urllib.parse import urljoin

from django.conf import settings

from news_events.constants import FeedType
from news_events.etl.utils import fetch_data_by_page, parse_date

log = logging.getLogger(__name__)
MITPE_NEWS_TITLE = "MIT Professional Education News"
MITPE_NEWS_DESCRIPTION = """
News and updates from MIT Professional Education.
"""


def extract() -> list[dict]:
    """
    Extract data from the MITPE news API.

    Returns:
        list[dict]: News data in JSON format.
    """
    if settings.MITPE_BASE_API_URL:
        return list(
            fetch_data_by_page(urljoin(settings.MITPE_BASE_API_URL, "/feeds/news/"))
        )
    else:
        log.warning("Missing required setting MITPE_BASE_API_URL")
    return []


def transform_image(news_dict: dict) -> dict:
    """
    Transform the image from the MIT Professional Education news API.

    Args:
        news_dict (dict): extracted news item data

    Returns:
        dict: transformed news item image data

    """
    if news_dict.get("image"):
        img_text = html.unescape(news_dict["title"])
        return {
            "url": urljoin(settings.MITPE_BASE_URL, news_dict["image"]),
            "alt": img_text,
            "description": img_text,
        }
    return {}


def parse_authors(authors_str: str) -> list[str]:
    """
    Parse the authors from the MIT Professional Education news API.

    Args:
        authors_str (str): extracted news item authors data

    Returns:
        list[str]: list of authors

    """
    authors = authors_str.strip()
    for splitter in ["and", "|"]:
        if splitter in authors:
            return [
                author.strip() for author in authors.split(splitter) if author.strip()
            ]
    return [authors] if authors else []


def transform_item(item: list[dict]) -> dict:
    """
    Transform the items from the MIT Professional Education news API.

    Args:
        item (list of dict): extracted news data item

    Returns:
        dict: transformed news item data

    """
    return {
        "guid": item["id"],
        "title": html.unescape(item["title"]),
        "url": urljoin(settings.MITPE_BASE_URL, item["url"]),
        "summary": html.unescape(item["summary"]),
        "content": html.unescape(item["summary"]),
        "image": transform_image(item),
        "detail": {
            "authors": parse_authors(item["author"]),
            "topics": [],
            "publish_date": parse_date(item["date"]),
        },
    }


def transform_items(news_data: list[dict]) -> list[dict]:
    """
    Transform the items from the MIT Professional Education news API.

    Args:
        news_data (list of dict): list of extracted news data

    Returns:
        list of dict: list of transformed news items data

    """
    return sorted(
        [transform_item(item) for item in news_data],
        key=lambda x: x["detail"]["publish_date"],
    )


def transform(news_data: list[dict]) -> list[dict]:
    """
    Transform the data from the MIT Professional Education news api.

    Args:
        news_data (list of dict): list of extracted news data

    Returns:
        list of dict: list of transformed news source/items data

    """

    return [
        {
            "title": MITPE_NEWS_TITLE,
            "url": urljoin(settings.MITPE_BASE_URL, "/news"),
            "feed_type": FeedType.news.name,
            "description": MITPE_NEWS_DESCRIPTION,
            "items": [item for item in transform_items(news_data) if item],
        }
    ]
