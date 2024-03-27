"""Tests for loaders module"""

from copy import deepcopy
from unittest.mock import ANY

import pytest

from news_events.constants import FeedType
from news_events.etl import loaders
from news_events.factories import FeedImageFactory, FeedItemFactory, FeedSourceFactory
from news_events.models import FeedImage, FeedItem, FeedSource

pytestmark = [pytest.mark.django_db]


@pytest.mark.parametrize("feed_type", FeedType.names())
def test_load_feed_sources(sources_data, feed_type):
    """Tests that laod_sources creates appropriate sources, items, images, topics, details"""
    is_news = feed_type == FeedType.news.name
    original_data = sources_data.news if is_news else sources_data.events
    loaded_data = deepcopy(original_data)
    results = loaders.load_feed_sources(feed_type, loaded_data)
    for idx, result in enumerate(results):
        assert result[0].url == original_data[idx]["url"]
        assert len(result[1]) == len(original_data[idx]["items"])
    assert FeedSource.objects.count() == 2
    for source_idx, source in enumerate(FeedSource.objects.all().order_by("url")):
        for attr in ["url", "title", "description"]:
            assert getattr(source, attr) == original_data[source_idx][attr]
        source_items = source.feed_items.order_by("id")
        assert source_items.count() == len(original_data[source_idx]["items"])
        for item_idx, item in enumerate(source_items):
            if original_data[source_idx]["items"][item_idx]["image"]:
                assert (
                    item.image.url
                    == original_data[source_idx]["items"][item_idx]["image"]["url"]
                )
            else:
                assert item.image is None
            if is_news:
                assert (
                    item.news_details.authors
                    == original_data[source_idx]["items"][item_idx]["detail"]["authors"]
                )
                assert len(item.news_details.topics) == len(
                    original_data[source_idx]["items"][item_idx]["detail"]["topics"]
                )
                assert len(item.news_details.topics) > 0
            else:
                for attr in ("location", "audience", "event_type"):
                    assert (
                        getattr(item.event_details, attr)
                        == original_data[source_idx]["items"][item_idx]["detail"][attr]
                    )


def load_feed_sources_bad_item(mocker, sources_data):
    """Error should be logged for a bad feed item"""
    mock_log = mocker.patch("news_events.etl.loaders.log.exception")
    original_data = sources_data.news
    original_data[0]["items"].append({"bad": "item"})
    loaders.load_feed_sources(FeedType.news.name, original_data)
    mock_log.assert_called_once_with(
        "Error loading item %s for %s", {"bad": "item"}, ANY
    )


def test_load_feed_sources_delete_old_items(sources_data):
    """Tests that load_sources deletes old items and images"""
    source_data = sources_data.news
    source = FeedSourceFactory.create(
        url=source_data[0]["url"], feed_type=FeedType.news.name
    )
    old_source_item = FeedItemFactory(source=source, is_news=True)
    other_source_item = FeedItemFactory.create(is_news=True)
    orphaned_image = FeedImageFactory.create()  # no source or item

    loaders.load_feed_sources(FeedType.news.name, source_data)

    assert FeedItem.objects.filter(pk=old_source_item.pk).exists() is False
    assert FeedImage.objects.filter(pk=old_source_item.image.pk).exists() is False
    assert FeedItem.objects.filter(pk=other_source_item.pk).exists() is True
    assert FeedImage.objects.filter(pk=other_source_item.image.pk).exists() is True
    assert FeedImage.objects.filter(pk=orphaned_image.pk).exists() is False
    assert FeedItem.objects.filter(source=source).count() == 2


def test_load_item_null_data():
    """None should be returned from load_item if input data is None"""
    assert loaders.load_feed_item(FeedSourceFactory.create(), None) is None


def test_load_source_null_data():
    """None should be returned from load_feed_source if input data is None"""
    assert loaders.load_feed_source(FeedType.news.name, None) is None
