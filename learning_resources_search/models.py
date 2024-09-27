from urllib.parse import urlencode

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import JSONField

from channels.models import Channel
from main.models import TimestampedModel

User = get_user_model()


class PercolateQuery(TimestampedModel):
    """An opensearch query used in percolate"""

    SEARCH_SUBSCRIPTION_TYPE = "search_subscription_type"
    CHANNEL_SUBSCRIPTION_TYPE = "channel_subscription_type"

    SOURCE_TYPES = [
        SEARCH_SUBSCRIPTION_TYPE,
        CHANNEL_SUBSCRIPTION_TYPE,
    ]

    original_query = JSONField()
    query = JSONField()
    source_type = models.CharField(
        max_length=255, choices=[(choice, choice) for choice in SOURCE_TYPES]
    )

    display_label = models.CharField(
        max_length=255,
        blank=True,
        help_text="Friendly display label for the query",
    )
    users = models.ManyToManyField(User, related_name="percolate_queries")

    def source_label(self):
        source_channel = self.source_channel()
        if source_channel:
            return source_channel.channel_type
        else:
            return "saved_search"

    def source_description(self):
        channel = self.source_channel()
        if self.display_label:
            return self.display_label
        if channel:
            return channel.title
        return self.original_url_params()

    def source_channel(self):
        original_query_params = self.original_url_params()
        channels_filtered = Channel.objects.filter(search_filter=original_query_params)
        if channels_filtered.exists():
            return channels_filtered.first()
        return None

    def original_url_params(self):
        ignore_params = ["endpoint"]
        query = self.original_query
        defined_params = {
            key: query[key] for key in query if query[key] and key not in ignore_params
        }
        return urlencode(defined_params, doseq=True)

    def __str__(self):
        return f"Percolate query {self.id}: {self.query}"

    class Meta:
        unique_together = (("source_type", "original_query"),)
