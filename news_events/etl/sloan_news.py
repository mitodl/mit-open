"""ETL for blog/news from Sloan School of Management"""

from bs4 import BeautifulSoup as Soup
from bs4 import Tag
from dateutil import parser

from main.constants import ISOFORMAT
from news_events.constants import FeedType
from news_events.etl.utils import get_soup, safe_html, tag_text

SLOAN_BLOG_URL = "https://mitsloanedtech.mit.edu/blog/"


def extract() -> Soup:
    """Extract html as a BeautifulSoup object from Sloan School of Management"""
    return get_soup(SLOAN_BLOG_URL)


def extract_page(item: Soup) -> Soup:
    """Extract the page url from the item"""
    return get_soup(item.find("a", class_="entire-meta-link").attrs["href"])


def parse_topics(tag: Tag) -> list[str]:
    """Get all the topics for a blog article"""
    return [tag_text(topic) for topic in tag.find_all("a") if topic] if tag else []


def transform_item(item: Soup) -> dict:
    """Transform an item from both the index page soup and item page soup"""
    image = item.find("img")
    url = item.find("a", class_="entire-meta-link").attrs["href"]
    date_str = tag_text(item.find("a", rel="author").findNext())
    return {
        "title": tag_text(item.find("h3")),
        "url": url,
        "guid": url,
        "summary": tag_text(item.find("div", class_="excerpt")),
        "content": safe_html(item.find("div", class_="excerpt")),
        "image": {
            "url": image.attrs.get("src"),
            "alt": image.attrs.get("alt"),
            "description": image.attrs.get("title"),
        },
        "detail": {
            "authors": [tag_text(item.find("a", rel="author"))],
            "topics": parse_topics(item.find("span", class_="meta-category")),
            "publish_date": parser.parse(date_str).strftime(ISOFORMAT)
            if date_str
            else None,
        },
    }


def transform_items(items_data: list[Soup]) -> list[dict]:
    """Transform items from Sloan School of Management blog"""
    return [transform_item(item) for item in items_data if items_data]


def transform(source_data: Soup) -> list[dict]:
    """
    Transform the Soup data from Sloan School of Management.

    Args:
        source_data (Soup): BeautifulSoup representation of Sloan blog

    Returns:
        list of dict: List of transformed source data

    """
    return [
        {
            "title": tag_text(source_data.title),
            "url": SLOAN_BLOG_URL,
            "feed_type": FeedType.news.name,
            "description": source_data.find(
                "meta", attrs={"name": "description"}
            ).attrs.get("content", ""),
            "items": transform_items(source_data.find_all("article")),
        }
    ]
