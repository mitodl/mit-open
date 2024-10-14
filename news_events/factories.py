"""Test factories for news_events"""

import random
from datetime import UTC

import factory
from factory.fuzzy import FuzzyChoice

from news_events import models
from news_events.constants import FeedType


class FeedImageFactory(factory.django.DjangoModelFactory):
    """Factory for source/item images"""

    url = factory.Faker("url")
    description = factory.Faker("sentence")
    alt = factory.Faker("sentence")

    class Meta:
        model = models.FeedImage


class FeedSourceFactory(factory.django.DjangoModelFactory):
    """Factory for FeedSource model"""

    title = factory.Faker("text")
    url = factory.Faker("url")
    description = factory.Faker("paragraph")
    feed_type = FuzzyChoice([feed_type.name for feed_type in FeedType])
    image = factory.SubFactory(FeedImageFactory)

    class Meta:
        model = models.FeedSource

    class Params:
        is_news_type = factory.Trait(feed_type=FeedType.news.name)
        is_events_type = factory.Trait(feed_type=FeedType.events.name)


class FeedImageFactory(factory.django.DjangoModelFactory):
    """Factory for images"""

    url = factory.Faker("url")
    description = factory.Faker("sentence")
    alt = factory.Faker("sentence")

    class Meta:
        model = models.FeedImage


class FeedItemFactory(factory.django.DjangoModelFactory):
    """Factory for feed items"""

    source = factory.SubFactory(FeedSourceFactory)
    guid = factory.Sequence(lambda n: "http://feed.mit.edu/%03d/rss" % n)
    title = factory.Faker("word")
    url = factory.Faker("url")
    summary = factory.Faker("paragraph")
    content = factory.Faker("paragraph")
    image = factory.SubFactory(FeedImageFactory)

    news_detail = factory.Maybe(
        "create_news_detail",
        yes_declaration=factory.RelatedFactory(
            "news_events.factories.FeedNewsDetailFactory",
            factory_related_name="feed_item",
        ),
    )
    event_detail = factory.Maybe(
        "create_event_detail",
        yes_declaration=factory.RelatedFactory(
            "news_events.factories.FeedEventDetailFactory",
            factory_related_name="feed_item",
        ),
    )

    class Meta:
        model = models.FeedItem

    class Params:
        is_news = factory.Trait(source__feed_type=FeedType.news.name)
        is_event = factory.Trait(source__feed_type=FeedType.events.name)
        create_news_detail = factory.LazyAttribute(
            lambda item: item.source.feed_type == FeedType.news.name
        )
        create_event_detail = factory.LazyAttribute(
            lambda item: item.source.feed_type == FeedType.events.name
        )


class FeedNewsDetailFactory(factory.django.DjangoModelFactory):
    """Factory for News Details"""

    feed_item = factory.SubFactory(
        FeedItemFactory, is_news=True, create_news_detail=False
    )
    authors = factory.List([factory.Faker("word")])
    topics = factory.List([factory.Faker("word")])
    publish_date = factory.Faker("date_time", tzinfo=UTC)

    class Meta:
        model = models.FeedNewsDetail


class FeedEventDetailFactory(factory.django.DjangoModelFactory):
    """Factory for Event Details"""

    feed_item = factory.SubFactory(
        FeedItemFactory, is_event=True, create_event_detail=False
    )

    audience = factory.List(random.choices(["Faculty", "Public", "Students"]))  # noqa: S311
    location = factory.List(random.choices(["Online", "MIT Campus"]))  # noqa: S311
    event_type = factory.List(random.choices(["Webinar", "Concert", "Conference"]))  # noqa: S311
    event_datetime = factory.Faker("future_datetime", tzinfo=UTC)

    class Meta:
        model = models.FeedEventDetail
