"""Utility functions for news/events ETL pipelines"""

from datetime import UTC, datetime
from time import mktime, struct_time

import pytz
import requests
from bs4 import BeautifulSoup as Soup
from bs4 import Tag
from django.conf import settings

from main.constants import ISOFORMAT


def get_soup(url: str) -> Soup:
    """Get a BeautifulSoup object from a URL."""
    response = requests.get(url, timeout=settings.REQUESTS_TIMEOUT)
    response.raise_for_status()
    return Soup(response.content, features="lxml")


def tag_text(tag: Tag) -> str:
    """Get the text from a BeautifulSoup tag."""
    return tag.text.strip() if tag and tag.text else None


def safe_html(tag: Tag) -> str:
    """Get safe html from a BeautifulSoup tag, with no styles, classes, etc"""
    if tag:
        [element.decompose() for element in tag.findAll(["script", "style"])]
        children = tag.find_all(recursive=True)
        for element in [tag, *children]:
            for attribute in ["style", "class"]:
                del element[attribute]
        return str(tag)
    return None


def stringify_time_struct(time_struct: struct_time) -> str:
    """Transform a struct_time object into an ISO formatted date string"""
    min_year = 100
    if time_struct:
        dt = datetime.fromtimestamp(mktime(time_struct), tz=UTC)
        if time_struct.tm_isdst != 0:
            # tm_dst = adjustment in hours from UTC, reverse it
            dt = dt.replace(hour=dt.hour + time_struct.tm_isdst * -1)
        # Sometimes the year is just 2 digits
        if dt.year < min_year:
            dt = dt.replace(year=2000 + dt.year)
        dt_utc = dt.astimezone(pytz.utc)
        return dt_utc.strftime(ISOFORMAT)
    return None
