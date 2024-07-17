"""ETL for blog/news from Sloan School of Management Executive Education"""

import logging
import re
from datetime import UTC
from urllib.parse import urlencode, urljoin
from zoneinfo import ZoneInfo

import dateparser
import requests
from django.utils.html import strip_tags

from news_events.constants import FeedType

log = logging.getLogger(__name__)

SLOAN_WEBINAR_TITLE = "MIT Sloan Executive Education Webinars"
SLOAN_WEBINAR_BASE_URL = "https://exec.mit.edu/"
SLOAN_WEBINAR_URL = urljoin(SLOAN_WEBINAR_BASE_URL, "/s/webinars")
SLOAN_WEBINAR_PREFIX_URL = urljoin(SLOAN_WEBINAR_BASE_URL, "/s/webinar-post/")
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
                        "id": "192;a",
                        "descriptor": "apex://CMSContentController/ACTION$fetchTopicPage",
                        "callingDescriptor": "markup://c:CMS_ThreeCardDisplay",
                        "params": {
                            "contentType": "Card_Display_Item",
                            "topicName": "Upcoming Webinars",
                            "pageSize": 20,
                            "pageNumber": 0,
                        },
                    },
                    {
                        "id": "111;a",
                        "descriptor": "apex://CMSContentController/ACTION$fetchTopicPage",
                        "callingDescriptor": "markup://c:CMS_WebinarList",
                        "params": {
                            "contentType": "Webinar_Post",
                            "topicName": "Recent Webinar",
                            "pageSize": 20,
                            "pageNumber": 0,
                            "AscDesc": "DESC",
                            "sortFields": ["DateTime1"],
                        },
                    },
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
            "aura.pageURI": "/s/webinars",
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
    Extract JSON from Sloan's Webinar listing

    Returns:
        dict: JSON data from Sloan blog post request
    """
    session = requests.Session()
    content = str(session.get(SLOAN_WEBINAR_URL).content)
    fwuid = re.findall(r"fwuid%22%3A%22([^%]+)%22", content)[0]
    appId = re.findall(r"siteforce%3AcommunityApp%22%3A%22([^%]+)%", content)[0]
    session.headers["Content-Type"] = "application/x-www-form-urlencoded"
    return session.post(
        SLOAN_WEBINAR_POST_URL,
        data=SLOAN_WEBINAR_POST_DATA.replace("FWUID_VAR", fwuid).replace(
            "APPID_VAR", appId
        ),
    ).json()


def extract_event_image(image_data: dict) -> tuple[dict, dict]:
    """
    Extract the image data from the Open Learning Event.

    Args:
        image_data (dict): The image data

    Returns:
        tuple[dict, dict]: The image text metadata and image source metadata

    """
    altText = image_data.get("altText", "")
    imagePath = image_data.get("url", "")
    if imagePath:
        return {
            "url": urljoin(SLOAN_WEBINAR_BASE_URL, imagePath),
            "alt": altText if altText else "",
            "description": altText if altText else "",
        }
    else:
        return None


def transform_item(event_data: dict) -> dict:
    """
    Transform item from Sloan School of Management blog

    Args:
        event_data (dict): raw JSON data for a single webinar post

    Returns:
        dict: Transformed data for a single webinar post

    """
    attributes = event_data.get("contentNodes", {})
    guid = event_data["contentKey"]
    dt = event_data.get("publishedDate")
    text_date = attributes.get("Image_Text", {}).get("value", "")
    try:
        dt_utc = (
            dateparser.parse(text_date)
            .replace(tzinfo=ZoneInfo("US/Eastern"))
            .astimezone(UTC)
            if dt
            else None
        )
    except:  # noqa: E722
        logging.exception("unparsable date received - ignoring webinar '%s'", guid)
        return None
    cta_button = attributes.get("CTA_Button_URL", {}).get("value", "")
    return {
        "guid": guid,
        "url": cta_button,
        "title": event_data.get("title", ""),
        "image": extract_event_image(attributes.get("Card_Image", {})),
        "summary": strip_tags(attributes.get("Summary", {}).get("value") or ""),
        "content": strip_tags(
            attributes.get("Full_Webinar_Summary", {}).get("value") or ""
        ),
        "detail": {
            "location": ["Online"],
            "event_datetime": dt_utc,
            "event_type": [
                topic["name"]
                for topic in event_data.get("associations", {}).get("topics", [])
            ],
            "audience": ["Faculty", "MIT Community", "Public", "Students"],
        },
    }


def transform_items(source_data: dict) -> list[dict]:
    """
    Transform items from Sloan Webinars blog

    Args:
        source_data (dict): raw JSON data for Sloan blog posts

    Returns:
        list of dict: List of transformed webinar posts

    """
    items_data = source_data.get("actions")
    if not items_data:
        log.error("No posts found in the Sloan blog source data")
        return []
    for item in items_data:
        if isinstance(item.get("returnValue"), dict):
            contents = item.get("returnValue").get("content")
            for content in contents:
                if "contentNodes" in content:
                    yield transform_item(content)


def transform(source_data: dict) -> list[dict]:
    """
    Transform the data from Sloan webinar listings.

    Args:
        source_data (Soup): BeautifulSoup representation of Sloan blog index page


    Returns:
        list of dict: List of transformed source data

    """
    return [
        {
            "title": SLOAN_WEBINAR_TITLE,
            "url": SLOAN_WEBINAR_URL,
            "feed_type": FeedType.events.name,
            "description": SLOAN_WEBINAR_TITLE,
            "items": transform_items(source_data),
        }
    ]
