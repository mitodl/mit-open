from urllib.parse import unquote_plus, urlencode

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import JSONField

from channels.constants import ChannelType
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
    users = models.ManyToManyField(User, related_name="percolate_queries")

    def __str__(self):
        return f"Percolate query {self.id}: {self.query}"

    class Meta:
        unique_together = (("source_type", "original_query"),)

    def original_url_params(self):
        ignore_params = ["endpoint"]
        query = self.original_query
        defined_params = {
            key: query[key] for key in query if query[key] and key not in ignore_params
        }
        return unquote_plus(urlencode(defined_params, doseq=True))

    def source_label(self):
        original_query_params = self.original_url_params()
        channels_filtered = Channel.objects.filter(search_filter=original_query_params)
        if channels_filtered.exists():
            return channels_filtered.first().channel_type
        else:
            return "saved search"

    def source_description(self):
        original_query_params = self.original_url_params()
        source_label = self.source_label()

        if source_label in ChannelType:
            channel = Channel.objects.get(search_filter=original_query_params)
            return channel.title
        return self.original_url_params()
