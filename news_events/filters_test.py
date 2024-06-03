"""Tests for news_events filters"""

import pytest

from news_events.constants import NEWS_EVENTS_SORTBY_OPTIONS, FeedType
from news_events.factories import FeedItemFactory, FeedSourceFactory

SOURCE_API_URL = "/api/v0/news_events_sources/"
ITEM_API_URL = "/api/v0/news_events/"


@pytest.mark.parametrize(
    "multifilter", ["feed_type={}&feed_type={}", "feed_type={},{}"]
)
def test_source_filter_feed_type(client, multifilter):
    """Test that the feed type filter works for sources"""
    sources = [
        FeedSourceFactory.create(feed_type=feed_type) for feed_type in FeedType.names()
    ]
    FeedSourceFactory.create(feed_type="other")

    type_filter = multifilter.format(FeedType.news.name, FeedType.events.name)
    results = client.get(f"{SOURCE_API_URL}?{type_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [source.id for source in sources]
    )


@pytest.mark.parametrize(
    "multifilter", ["feed_type={}&feed_type={}", "feed_type={},{}"]
)
def test_item_filter_feed_type(client, multifilter):
    """Test that the feed type filter works for sources"""
    sources = [
        FeedSourceFactory.create(feed_type=feed_type) for feed_type in FeedType.names()
    ]
    items = [FeedItemFactory.create(source=source) for source in sources]
    other_source = FeedSourceFactory.create(feed_type="other")
    FeedItemFactory.create(source=other_source)

    type_filter = multifilter.format(FeedType.news.name, FeedType.events.name)
    results = client.get(f"{ITEM_API_URL}?{type_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [item.id for item in items]
    )


@pytest.mark.parametrize("sortby", ["created", "event_date"])
@pytest.mark.parametrize("descending", [True, False])
def test_learning_resource_sortby(client, sortby, descending):
    """Test that the query is sorted in the correct order"""
    source = FeedSourceFactory.create(feed_type=FeedType.events.name)
    items = FeedItemFactory.create_batch(4, source=source, is_event=True)
    sortby_param = sortby
    if descending:
        sortby_param = f"-{sortby}"

    results = client.get(
        f"{ITEM_API_URL}?feed_type=events&sortby={sortby_param}"
    ).json()["results"]

    def get_sort_field(item):
        """Get the field to be sorted on"""
        sort_fields = NEWS_EVENTS_SORTBY_OPTIONS[sortby]["sort"].split("__")
        if len(sort_fields) < 2:
            return getattr(item, sort_fields[0])
        else:
            return getattr(getattr(item, sort_fields[0]), sort_fields[1])

    assert [result["id"] for result in results] == (
        [
            item.id
            for item in sorted(
                items,
                key=lambda x: get_sort_field(x),
                reverse=descending,
            )
        ]
    )
