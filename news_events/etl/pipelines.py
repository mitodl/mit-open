"""News and events pipelines"""

from toolz import compose, curry

from news_events.constants import FeedType
from news_events.etl import (
    loaders,
    medium_mit_news,
    ol_events,
    sloan_exec_news,
    sloan_webinars,
)

load_sources = curry(loaders.load_feed_sources)

# Pipeline for Medium MIT News
medium_mit_news_etl = compose(
    load_sources(FeedType.news.name),
    medium_mit_news.transform,
    medium_mit_news.extract,
)

# Pipeline for Sloan blog
sloan_exec_news_etl = compose(
    load_sources(FeedType.news.name),
    sloan_exec_news.transform,
    sloan_exec_news.extract,
)
sloan_webinars_etl = compose(
    load_sources(FeedType.events.name),
    sloan_webinars.transform,
    sloan_webinars.extract,
)


# Pipeline for Open Learning Events
ol_events_etl = compose(
    load_sources(FeedType.events.name),
    ol_events.transform,
    ol_events.extract,
)
