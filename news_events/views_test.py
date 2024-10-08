"""Tests for news_events views"""

from datetime import UTC, datetime

import pytest
from django.urls import reverse

from main.test_utils import assert_json_equal
from news_events import factories, serializers
from news_events.constants import FeedType
from news_events.factories import FeedEventDetailFactory


def test_feed_source_viewset_list(client):
    """Est that the feed sources list viewset returns data in expected format"""
    sources = sorted(factories.FeedSourceFactory.create_batch(5), key=lambda x: x.id)
    results = (
        client.get(reverse("news_events:v0:news_events_sources_api-list"))
        .json()
        .get("results")
    )
    assert_json_equal(
        results,
        [serializers.FeedSourceSerializer(instance=source).data for source in sources],
    )


@pytest.mark.parametrize("feed_type", FeedType.names())
def test_feed_source_viewset_list_filtered(client, feed_type):
    """Test that the sources list viewset returns data filtered by feed type"""
    is_news = feed_type == FeedType.news.name
    filtered = sorted(
        factories.FeedSourceFactory.create_batch(2, feed_type=feed_type),
        key=lambda x: x.id,
    )
    # This should not be in results
    factories.FeedSourceFactory.create(
        feed_type=FeedType.events.name if is_news else FeedType.news.name
    )
    results = (
        client.get(
            reverse("news_events:v0:news_events_sources_api-list"),
            {"feed_type": feed_type},
        )
        .json()
        .get("results")
    )
    assert_json_equal(
        results,
        [serializers.FeedSourceSerializer(instance=source).data for source in filtered],
    )


def test_feed_source_viewset_detail(client):
    """Test that the feed sources detail viewset returns data in expected format"""
    source = factories.FeedSourceFactory.create()
    result = client.get(
        reverse(
            "news_events:v0:news_events_sources_api-detail", kwargs={"pk": source.id}
        )
    ).json()
    assert_json_equal(result, serializers.FeedSourceSerializer(instance=source).data)


@pytest.mark.parametrize("is_news", [True, False])
def test_feed_item_viewset_list(client, is_news):
    """Est that the feed sources list viewset returns data in expected format"""
    items = sorted(
        factories.FeedItemFactory.create_batch(
            5, is_news=is_news, is_event=not is_news
        ),
        key=lambda x: x.news_details.publish_date
        if is_news
        else x.event_details.event_datetime,
        reverse=True,
    )
    past_event = FeedEventDetailFactory(
        event_datetime=datetime(2020, 1, 1, tzinfo=UTC)
    ).feed_item
    results = (
        client.get(reverse("news_events:v0:news_events_items_api-list"))
        .json()
        .get("results")
    )
    assert_json_equal(
        [serializers.FeedItemSerializer(instance=item).data for item in items], results
    )
    assert past_event.id not in [item["id"] for item in results]


@pytest.mark.parametrize("feed_type", FeedType.names())
def test_feed_item_viewset_list_filtered(client, feed_type):
    """Test that the items list viewset returns data filtered by source feed type"""
    is_news = feed_type == FeedType.news.name
    filtered = sorted(
        factories.FeedItemFactory.create_batch(
            2, is_news=is_news, is_event=not is_news
        ),
        key=lambda x: x.news_details.publish_date
        if is_news
        else x.event_details.event_datetime,
        reverse=True,
    )
    # This should not be in results
    factories.FeedItemFactory.create(is_news=not is_news, is_event=is_news)
    results = (
        client.get(
            reverse("news_events:v0:news_events_items_api-list"),
            {"feed_type": feed_type},
        )
        .json()
        .get("results")
    )
    assert_json_equal(
        [serializers.FeedItemSerializer(instance=item).data for item in filtered],
        results,
    )


@pytest.mark.parametrize("is_news", [True, False])
def test_feed_item_viewset_detail(client, is_news):
    """Test that the feed items detail viewset returns data in expected format"""
    item = factories.FeedItemFactory.create(is_news=is_news, is_event=not is_news)
    expected = serializers.FeedItemSerializer(instance=item).data
    result = client.get(
        reverse("news_events:v0:news_events_items_api-detail", kwargs={"pk": item.id})
    ).json()
    assert_json_equal(result, expected)
