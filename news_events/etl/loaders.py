"""Model loaders for news_events"""

import logging

from news_events.constants import FeedType
from news_events.models import (
    FeedEventDetail,
    FeedImage,
    FeedItem,
    FeedNewsDetail,
    FeedSource,
    FeedTopic,
)

log = logging.getLogger(__name__)


def load_news_detail(item, item_details):
    """
    Load news detail
    """
    detail, _ = FeedNewsDetail.objects.update_or_create(
        feed_item=item, defaults={**item_details}
    )
    return detail


def load_event_detail(item, item_details):
    """
    Load news item
    """
    detail, _ = FeedEventDetail.objects.update_or_create(
        feed_item=item, defaults={**item_details}
    )
    return detail


def load_topics(item, topics_data):
    """
    Load news/event topics
    """
    topics = [
        FeedTopic.objects.update_or_create(
            url=topic_data.get("url"),
            code=topic_data.get("code"),
            name=topic_data.get("name"),
        )[0]
        for topic_data in topics_data
    ]
    item.topics.set(topics)
    return topics


def load_image(item, image_data):
    """
    Load news/events image
    """
    if not image_data:
        return None
    image, _ = FeedImage.objects.update_or_create(
        url=image_data.get("url"),
        description=image_data.get("description"),
        alt=image_data.get("alt"),
    )
    item.image = image
    item.save()
    return image


def load_feed_item(source, item_data):
    """
    Load a feed item
    """
    if item_data is None:
        return None

    topics_data = item_data.pop("topics", [])
    image_data = item_data.pop("image", None)
    item_details = item_data.pop("detail", None)

    item, _ = FeedItem.objects.update_or_create(
        guid=item_data.get("guid"),
        defaults={
            "source": source,
            "title": item_data.get("title"),
            "url": item_data.get("url"),
            "summary": item_data.get("summary"),
            "content": item_data.get("content"),
            "item_date": item_data.get("item_date"),
        },
    )

    if source.feed_type == FeedType.news.name:
        load_news_detail(item, item_details)
    elif source.feed_type == FeedType.events.name:
        load_event_detail(item, item_details)

    load_topics(item, topics_data)
    load_image(item, image_data)

    if image_data:
        image, _ = FeedImage.objects.get_or_create(
            url=image_data.get("url"),
            defaults={
                "description": image_data.get("description"),
                "alt": image_data.get("alt"),
            },
        )
        item.image = image
        item.save()

    return item


def load_feed_source(feed_type: str, source_data: dict):
    """
    Load a feed source
    """
    if source_data is None:
        return None

    items_data = source_data.pop("items")

    source, _ = FeedSource.objects.update_or_create(
        feed_type=feed_type,
        url=source_data.get("url"),
        defaults={
            "description": source_data.get("description"),
            "title": source_data.get("title"),
        },
    )

    for item_data in items_data:
        try:
            load_feed_item(source, item_data)
        except:  # noqa: E722
            log.exception("Error loading item %s for %s", item_data, source)
            continue

    return source


def load_feed_sources(feed_type: str, sources_data: list[dict]):
    """
    Load feed sources for a given feed type
    """
    sources_list = list(sources_data or [])

    return [
        source
        for source in [
            load_feed_source(feed_type, source_data)
            for source_data in sources_list
            if source_data is not None
        ]
        if source is not None
    ]
