from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import JSONField

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
