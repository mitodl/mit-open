from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import JSONField

from main.models import TimestampedModel

User = get_user_model()


class PercolateQuery(TimestampedModel):
    """An opensearch query used in percolate"""

    SEARCH_SUBSCRIPTION_TYPE = "search_subscription_type"

    SOURCE_TYPES = [
        SEARCH_SUBSCRIPTION_TYPE,
    ]

    original_query = JSONField()
    query = JSONField()
    source_type = models.CharField(
        max_length=255, choices=[(choice, choice) for choice in SOURCE_TYPES]
    )

    def __str__(self):
        return f"Percolate query {self.id}: {self.query}"


class PercolateQueryUser(TimestampedModel):
    """
    A user's membership in a PercolateQuery.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="percolate_query_users",
    )
    query = models.ForeignKey(
        PercolateQuery, on_delete=models.CASCADE, related_name="percolate_query_users"
    )

    def __str__(self):
        return f"Percolate query user: {self.user_id}, query: {self.query_id}"

    class Meta:
        unique_together = (("user", "query"),)
