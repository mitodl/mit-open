"""ETL for blog/news from Sloan School of Management Executive Education"""

import html
import logging
import re
from urllib.parse import urlencode, urljoin

import requests
from bs4 import BeautifulSoup as Soup

from news_events.constants import FeedType
from news_events.etl.utils import tag_text

log = logging.getLogger(__name__)

SLOAN_WEBINAR_TITLE = "MIT Sloan Executive Education"
SLOAN_WEBINAR_BASE_URL = "https://exec.mit.edu/"
SLOAN_WEBINAR_BLOG_URL = urljoin(SLOAN_WEBINAR_BASE_URL, "/s/blog")
SLOAN_WEBINAR_ARTICLE_PREFIX_URL = urljoin(SLOAN_WEBINAR_BASE_URL, "/s/blog-post/")
SLOAN_WEBINAR_POST_URL = urljoin(
    SLOAN_WEBINAR_BASE_URL,
    "/s/sfsites/aura?r=1&other.CMSContent.fetchImage=1&other.CMSContent.fetchImages=1&other.CMSContent.fetchTopicPage=2&other.CMSNav.fetchHeaderMessage=1&other.CMSNav.isLoggedIn=1",
)
SLOAN_WEBINAR_POST_DATA = (
    urlencode(
        {
            "message": {
                "actions": [
                    {
                        "id": "111;a",
                        "descriptor": "apex://CMSContentController/ACTION$fetchTopicPage",
                        "callingDescriptor": "markup://c:CMS_BlogPostList",
                        "params": {
                            "contentType": "Blog_Post",
                            "topicName": "",
                            "pageSize": 20,
                            "pageNumber": 0,
                            "sortFields": ["DateTime1"],
                            "AscDesc": "DESC",
                        },
                    }
                ]
            },
            "aura.context": {
                "mode": "PROD",
                "fwuid": "FWUID_VAR",
                "app": "siteforce:communityApp",
                "loaded": {
                    "APPLICATION@markup://siteforce:communityApp": "APPID_VAR",
                    "COMPONENT@markup://instrumentation:o11ySecondaryLoader": "",
                },
                "dn": [],
                "globals": {},
                "uad": False,
            },
            "aura.pageURI": "/s/blog",
            "aura.token": None,
        }
    )
    .replace("None", "null")
    .replace("False", "false")
    .replace("+", "")
    .replace("%27", "%22")
)


def extract() -> dict:
    """
    Extract JSON from Sloan School of Management

    Returns:
        dict: JSON data from Sloan blog post request
    """
    session = requests.Session()
    content = str(session.get(SLOAN_WEBINAR_BLOG_URL).content)
    fwuid = re.findall(r"fwuid%22%3A%22([^%]+)%22", content)[0]
    appId = re.findall(r"siteforce%3AcommunityApp%22%3A%22([^%]+)%", content)[0]
    session.headers["Content-Type"] = "application/x-www-form-urlencoded"
    return session.post(
        SLOAN_WEBINAR_POST_URL,
        data=SLOAN_WEBINAR_POST_DATA.replace("FWUID_VAR", fwuid).replace(
            "APPID_VAR", appId
        ),
    ).json()


def transform_item(item_data: dict) -> dict:
    """
    Transform item from Sloan School of Management blog

    Args:
        item_data (dict): raw JSON data for a single blog post

    Returns:
        dict: Transformed data for a single blog post

    """
    return {
        "guid": item_data.get("managedContentId"),
        "title": html.escape(item_data.get("title", "")),
        "summary": tag_text(
            Soup(
                html.unescape(
                    item_data.get("contentNodes", {}).get("Summary", {}).get("value")
                ),
                "lxml",
            )
        ),
        "content": html.unescape(
            item_data.get("contentNodes", {})
            .get("First_Section_Content", {})
            .get("value")
        ),
        "url": urljoin(
            SLOAN_WEBINAR_ARTICLE_PREFIX_URL,
            f'{item_data.get("contentUrlName")}-{item_data.get("managedContentId")}',
        ),
        "image": {
            "url": urljoin(
                SLOAN_WEBINAR_BASE_URL,
                item_data.get("contentNodes", {}).get("Featured_Image", {}).get("url")
                or "",
            ),
            "alt": item_data.get("contentNodes", {})
            .get("Featured_Image", {})
            .get("altText")
            or "",
            "description": item_data.get("contentNodes", {})
            .get("Featured_Image", {})
            .get("title")
            or "",
        },
        "detail": {
            "authors": [
                html.escape(
                    item_data.get("contentNodes", {})
                    .get("Quote_Author", {})
                    .get("value", "")
                )
            ],
            "publish_date": item_data.get("publishedDate"),
            "topics": [
                html.unescape(topic["name"])
                for topic in item_data.get("associations", {}).get("topics", [])
                if topic
            ],
        },
    }


def transform_items(source_data: dict) -> list[dict]:
    """
    Transform items from Sloan School of Management blog

    Args:
        source_data (dict): raw JSON data for Sloan blog posts

    Returns:
        list of dict: List of transformed blog posts

    """
    items_data = source_data.get("actions")
    if not items_data:
        log.error("No posts found in the Sloan blog source data")
        return []
    for item in items_data:
        if isinstance(item.get("returnValue"), dict):
            contents = item.get("returnValue").get("content")
            for content in contents:
                yield transform_item(content)


def transform(source_data: dict) -> list[dict]:
    """
    Transform the data from Sloan School of Management's blog.

    Args:
        source_data (Soup): BeautifulSoup representation of Sloan index page
        news_data (dict): JSON data from Sloan blog API request

    Returns:
        list of dict: List of transformed source data

    """
    return [
        {
            "title": SLOAN_WEBINAR_TITLE,
            "url": SLOAN_WEBINAR_BLOG_URL,
            "feed_type": FeedType.news.name,
            "description": SLOAN_WEBINAR_TITLE,
            "items": transform_items(source_data),
        }
    ]
