"""
Receivers for OpenSearch indexing
"""

import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from learning_resources_search.models import PercolateQuery
from learning_resources_search.utils import (
    percolate_query_removed_actions,
    percolate_query_saved_actions,
)

log = logging.getLogger(__name__)


@receiver(post_delete, sender=PercolateQuery)
def percolate_query_removed(sender, instance, **kwargs):  # noqa: ARG001
    """
    De-index percolate query post delete
    """
    percolate_query_removed_actions(instance)


@receiver(post_save, sender=PercolateQuery)
def percolate_query_saved(sender, instance, created, **kwargs):  # noqa: ARG001
    """
    Index percolate query after creation
    """
    percolate_query = PercolateQuery.objects.get(id=instance.id)
    percolate_query_saved_actions(percolate_query)
