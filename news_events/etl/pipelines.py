"""News and events pipelines"""

from toolz import compose, curry

from news_events.constants import FeedType
from news_events.etl import loaders, medium_mit_news, ol_events

load_sources = curry(loaders.load_feed_sources)

# Pipeline for Medium MIT News
medium_mit_news_etl = compose(
    load_sources(FeedType.news.name),
    medium_mit_news.transform,
    medium_mit_news.extract,
)

# Pipeline for Open Learning Events
ol_events_etl = compose(
    load_sources(FeedType.events.name),
    ol_events.transform,
    ol_events.extract,
)
