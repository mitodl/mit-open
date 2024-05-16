"""App config for news_events"""

from django.apps import AppConfig


class ExternalFeedsConfig(AppConfig):
    name = "news_events"

    def ready(self):
        from news_events import schema  # noqa: F401
