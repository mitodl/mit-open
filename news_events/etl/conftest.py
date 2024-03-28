"""Common fixtures for news_events tests"""

from pathlib import Path
from types import SimpleNamespace

import pytest

from news_events.constants import FeedType


@pytest.fixture()
def ol_events_html_data():
    """Catalog data fixture"""
    html_files = [
        "test_html/test_ol_events_index_page.html",
        "test_html/test_ol_events_item_1.html",
        "test_html/test_ol_events_item_2.html",
    ]
    pages_content = []
    for html_file in html_files:
        with Path.open(Path(html_file)) as in_file:
            pages_content.append(in_file.read())
    return pages_content


@pytest.fixture()
def sources_data() -> SimpleNamespace:
    """Return a list of sources"""
    news_details = {
        "authors": ["MIT Open Learning"],
        "topics": ["mit", "online-learning"],
    }
    event_details = {
        "location": ["Online"],
        "audience": ["Faculty", "MIT Community", "Public", "Students"],
        "event_type": ["Webinar"],
    }

    (news_sources, event_sources) = (
        [
            {
                "title": "MIT Open Learning - Medium",
                "url": "https://1medium.com/feed/open-learning",
                "feed_type": feed_type,
                "description": "News, ideas, and thought leadership on the future of learning.",  # noqa: E501
                "items": [
                    {
                        "guid": "https://1medium.com/p/a685e2b89c6a",
                        "title": "Meet 8 MIT women faculty who teach MITx courses and lead cutting-edge research",  # noqa: E501
                        "url": "https://medium.com/open-learning/meet-8-mit-women-faculty-who-teach-mitx-courses",
                        "summary": "Celebrating Women's History Month with MIT women's contributions to science.",  # noqa: E501
                        "content": "<h4>Celebrating Women's History Month with MIT women's contributions to science</h4",  # noqa: E501
                        "image": {
                            "url": "https://mit.edu/image1.jpg",
                            "description": "image description 1",
                            "alt": "alt image description 1",
                        },
                        "detail": {
                            "publish_date": "2024-03-15T13:42:36Z",
                            **news_details,
                        }
                        if feed_type == FeedType.news.name
                        else {
                            "event_datetime": "2024-03-15T13:42:36Z",
                            **event_details,
                        },
                    },
                    {
                        "guid": "https://medium.com/p/b9508faf3144",
                        "title": "Ten books from MIT faculty to expand your knowledge of teaching, learning, and technology",  # noqa: E501
                        "url": "https://medium.com/open-learning/ten-books-from-mit-faculty-to-expand-your-knowledge-of-teaching",
                        "summary": "Embark on a journey into the science of learning, innovation in schools",  # noqa: E501
                        "content": "<h4>Embark on a journey into the science of learning, innovation in schools</h4",  # noqa: E501
                        "image": {
                            "url": "https://mit.edu/image2.jpg",
                            "description": "image description 2",
                            "alt": "alt image description 2",
                        },
                        "detail": {
                            "publish_date": "2024-03-13T15:57:53Z",
                            **news_details,
                        }
                        if feed_type == FeedType.news.name
                        else {
                            "event_datetime": "2024-03-13T15:57:53Z",
                            **event_details,
                        },
                    },
                ],
            },
            {
                "title": "MIT Sloan News",
                "url": "https://2sloan.mit.edu/feed/rss",
                "feed_type": feed_type,
                "description": "Sloan News",
                "items": [
                    {
                        "guid": "https://slaon.mit.edu/p/asd3341324",
                        "title": "New Sloan classes",
                        "url": "https://slaon.mit.edu/p/asd3341324",
                        "summary": "There are 10 new courses offered by Sloan",
                        "content": "There are 10 new courses offered by Sloan",
                        "image": None,
                        "detail": {
                            "publish_date": "2024-02-15T13:42:36Z",
                            **news_details,
                        }
                        if feed_type == FeedType.news.name
                        else {
                            "event_datetime": "2024-02-15T13:42:36Z",
                            **event_details,
                        },
                    },
                ],
            },
        ]
        for feed_type in FeedType.names()
    )
    return SimpleNamespace(news=news_sources, events=event_sources)
