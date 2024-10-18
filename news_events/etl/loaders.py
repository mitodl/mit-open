"""Model loaders for news_events"""

import logging

from main.utils import now_in_utc
from news_events.constants import FeedType
from news_events.models import (
    FeedEventDetail,
    FeedImage,
    FeedItem,
    FeedNewsDetail,
    FeedSource,
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


def load_image(item: FeedItem or FeedSource, image_data: dict) -> FeedImage:
    """
    Load news/events image

    Args:
        item (FeedItem or FeedSource): The feed item/source to load the image for
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
        },
    )

    if source.feed_type == FeedType.news.name:
        load_news_detail(item, item_details)
    elif source.feed_type == FeedType.events.name:
        load_event_detail(item, item_details)

    load_image(item, image_data)

    return item


def load_feed_source(
    feed_type: str, source_data: dict
) -> tuple[FeedSource, list[FeedItem]]:
    """
    Load a feed source

    Args:
        feed_type (str): The type of feed source (news/events)
        source_data (dict): The feed source data

    Returns:
        tuple of FeedSource and list of FeedItems
    """
    if source_data is None:
        return None

    items_data = source_data.pop("items", None)
    image_data = source_data.pop("image", None)

    source, _ = FeedSource.objects.update_or_create(
        feed_type=feed_type,
        url=source_data.get("url"),
        defaults={
            "description": source_data.get("description"),
            "title": source_data.get("title"),
        },
    )
    load_image(source, image_data)

    items = []
    for item_data in items_data:
        try:
            items.append(load_feed_item(source, item_data))
        except:  # noqa: E722
            log.exception("Error loading item %s for %s", item_data, source)
            continue
    # Delete items and images that are no longer in the feed source,
    # if at least some items are present
    if len(items) > 0:
        FeedItem.objects.filter(source=source).exclude(
            pk__in=[item.pk for item in items if item]
        ).delete()
    # Always delete past events and orphaned images
    FeedImage.objects.filter(feeditem__isnull=True, feedsource__isnull=True).delete()
    if source.feed_type == FeedType.events.name:
        FeedItem.objects.filter(
            source=source,
            event_details__event_datetime__lt=now_in_utc(),
        ).delete()
    return source, items


def load_feed_sources(
    feed_type: str, sources_data: list[dict]
) -> list[tuple[FeedSource, list[FeedItem]]]:
    """
    Load feed sources for a given feed type

    Args:
        feed_type (str): The type of feed source (news/events)
        sources_data (list of dict): The feed sources data

    Returns:
        list of tuples of FeedSource and list of FeedItems
    """
    sources_list = list(sources_data or [])

    return [
        (source, items)
        for (source, items) in [
            load_feed_source(feed_type, source_data)
            for source_data in sources_list
            if source_data is not None
        ]
        if source is not None
    ]
