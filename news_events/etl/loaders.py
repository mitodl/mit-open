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


def load_news_detail(item: FeedItem, item_details: dict) -> FeedNewsDetail:
    """
    Load news detail

    Args:
        item (FeedItem): The feed item to load the news detail for
        item_details (dict): News detail attributes

    Returns:
        FeedNewsDetail: news detail object

    """
    detail, _ = FeedNewsDetail.objects.update_or_create(
        feed_item=item, defaults={**item_details}
    )
    return detail


def load_event_detail(item: FeedItem, item_details: dict) -> FeedEventDetail:
    """
    Load event detail

    Args:
        item (FeedItem): The feed item to load the news detail for
        item_details (dict): The event detail attributes

    Returns:
        FeedEventDetail: event detail object

    """
    detail, _ = FeedEventDetail.objects.update_or_create(
        feed_item=item, defaults={**item_details}
    )
    return detail


def load_topics(item: FeedItem, topics_data: list[dict]) -> list[FeedTopic]:
    """
    Load feed item topics

    Args:
        item (FeedItem): The feed item to load the news detail for
        topics_data (list): list of topic dicts

    Returns:
        list of FeedTopic: topic objects
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


def load_image(item: FeedItem, image_data: dict) -> FeedImage:
    """
    Load news/events image

    Args:
        item (FeedItem): The feed item to load the image for
        image_data (dict): The image data

    Returns:
        FeedImage: image object
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


def load_feed_item(source: FeedSource, item_data: dict) -> FeedItem:
    """
    Load a feed item

    Args:
        source (FeedSource): The feed source to load the item for
        item_data (dict): The feed item data

    Returns:
        FeedItem: Feed news/event item for the source
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


def load_feed_source(feed_type: str, source_data: dict) -> FeedSource:
    """
    Load a feed source

    Args:
        feed_type (str): The type of feed source (news/events)
        source_data (dict): The feed source data

    Returns:
        FeedSource: Feed news/event source object
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


def load_feed_sources(feed_type: str, sources_data: list[dict]) -> list[FeedSource]:
    """
    Load feed sources for a given feed type

    Args:
        feed_type (str): The type of feed source (news/events)
        sources_data (list of dict): The feed sources data

    Returns:
        list of FeedSource: Feed news/event source objects
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
