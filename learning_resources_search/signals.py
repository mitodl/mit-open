"""
Receivers for OpenSearch indexing
"""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from learning_resources.hooks import get_plugin_manager
from learning_resources_search.models import PercolateQuery


def percolate_query_removed_actions(percolate_query: PercolateQuery):
    """
    Trigger plugins when a LearningResource is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.percolate_query_delete(percolate_query=percolate_query)


def percolate_query_saved_actions(percolate_query: PercolateQuery):
    """
    Trigger plugins when a LearningResource is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.percolate_query_upserted(percolate_query=percolate_query)


@receiver(post_delete, sender=PercolateQuery)
def percolate_query_removed(sender, instance, **kwargs):  # noqa: ARG001
    percolate_query_removed_actions(instance)


@receiver(post_save, sender=PercolateQuery)
def percolate_query_saved(sender, instance, created, **kwargs):  # noqa: ARG001
    percolate_query = PercolateQuery.objects.get(id=instance.id)
    percolate_query_saved_actions(percolate_query)
