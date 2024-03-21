"""Tests for news_events serializers"""

import pytest

from main.test_utils import assert_json_equal
from news_events import serializers
from news_events.constants import FeedType
from news_events.factories import FeedItemFactory, FeedSourceFactory

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("feed_type", FeedType.names())
def test_feed_source_serializer(feed_type):
    """Test that the feed source serializer returns expected data"""
    source = FeedSourceFactory.create(feed_type=feed_type)
    serializer = serializers.FeedSourceSerializer(source)
    assert_json_equal(
        serializer.data,
        {
            "id": source.id,
            "title": source.title,
            "url": source.url,
            "feed_type": source.feed_type,
            "description": source.description,
            "image": {
                "id": source.image.id,
                "url": source.image.url,
                "description": source.image.description,
                "alt": source.image.alt,
            },
        },
    )


@pytest.mark.parametrize("feed_type", FeedType.names())
def test_feed_item_serializer(feed_type):
    """Test that the feed source serializer returns expected data"""
    is_news = feed_type == FeedType.news.name
    item = FeedItemFactory.create(is_news=is_news, is_event=not is_news)
    item_details_dict = (
        {"news_details": serializers.FeedNewsDetailSerializer(item.news_details).data}
        if is_news
        else {
            "event_details": serializers.FeedEventDetailSerializer(
                item.event_details
            ).data
        }
    )
    serializer = serializers.FeedItemSerializer(item)
    assert_json_equal(
        serializer.data,
        {
            "id": item.id,
            "guid": item.guid,
            "title": item.title,
            "url": item.url,
            "feed_type": item.source.feed_type,
            "summary": item.summary,
            "content": item.content,
            "source": item.source.id,
            "image": {
                "id": item.image.id,
                "url": item.image.url,
                "description": item.image.description,
                "alt": item.image.alt,
            },
            **item_details_dict,
        },
    )
