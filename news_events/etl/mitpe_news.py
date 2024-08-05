"""ETL functions for MIT professional Education news data."""

import html
import logging
from urllib.parse import urljoin

from main import settings
from main.utils import clean_data
from news_events.constants import FeedType
from news_events.etl.utils import fetch_data_by_page

log = logging.getLogger(__name__)
MITPE_NEWS_TITLE = "MIT Professional Education News"
MITPE_NEWS_DESCRIPTION = """
News and updates from MIT Professional Education.
"""
MITPE_NEWS_URL = urljoin(settings.MITPE_BASE_URL, "/news")
MITPE_NEWS_API_URL = urljoin(settings.MITPE_BASE_API_URL, "/feeds/news/")


def extract() -> list[dict]:
    """
    Extract data from the MITPE news API.

    Returns:
        list[dict]: News data in JSON format.
    """
    if settings.MITPE_BASE_API_URL:
        return list(fetch_data_by_page(MITPE_NEWS_API_URL))
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
        return {
            "url": urljoin(settings.MITPE_BASE_URL, news_dict["image"]),
            "alt": news_dict.get("title"),
            "description": news_dict.get("title"),
        }
    return {}


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
        "title": item["title"],
        "url": urljoin(settings.MITPE_BASE_URL, item["url"]),
        "summary": clean_data(html.unescape(item["summary"])),
        "content": clean_data(html.unescape(item["summary"])),
        "image": transform_image(item),
        "detail": {
            "authors": [html.unescape(item["author"])],
            "topics": [],
            "publish_date": item["date"],
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
    return [transform_item(item) for item in news_data]


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
            "url": MITPE_NEWS_URL,
            "feed_type": FeedType.news.name,
            "description": MITPE_NEWS_DESCRIPTION,
            "items": transform_items(news_data),
        }
    ]
