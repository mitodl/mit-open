"""Pluggy hooks for learning_resources"""

import logging

import pluggy
from django.apps import apps
from django.conf import settings
from django.utils.module_loading import import_string

log = logging.getLogger(__name__)

app_config = apps.get_app_config("learning_resources")
hookspec = app_config.hookspec


class LearningResourceHooks:
    """Pluggy hooks specs for Learning Resources"""

    @hookspec
    def percolate_query_upserted(self, percolate_query):
        """Trigger actions after a percolate query is created/saved"""

    @hookspec
    def document_percolated(self, resource, percolated_queries):
        """Trigger actions after a document is percolated"""

    @hookspec
    def percolate_query_delete(self, percolate_query):
        """Trigger actions after a percolate query is deleted"""

    @hookspec
    def resource_upserted(self, resource, percolate):
        """Trigger actions after a learning resource is created or updated"""

    @hookspec
    def resource_unpublished(self, resource):
        """Trigger actions after a learning resource is unpublished"""

    @hookspec
    def resource_similar_topics(self, resource) -> list[dict]:
        """Get similar topics for a learning resource"""

    @hookspec
    def bulk_resources_unpublished(self, resource_ids, resource_type):
        """Trigger actions after multiple learning resources are unpublished"""

    @hookspec
    def resource_delete(self, resource):
        """Trigger actions to remove a learning resource"""

    @hookspec
    def resource_run_upserted(self, run):
        """Trigger actions after a learning resource run is created or updated"""

    @hookspec
    def resource_run_unpublished(self, run, unpublished_only):
        """Trigger actions after a learning resource run is unpublished"""

    @hookspec
    def resource_run_delete(self, run):
        """Trigger actions to remove a learning resource run"""

    @hookspec
    def topic_upserted(self, topic, overwrite):
        """Trigger actions after a learning resource topic is created or updated"""

    @hookspec
    def topic_delete(self, topic):
        """Trigger actions to delete a learning resource topic"""

    @hookspec
    def department_upserted(self, department, overwrite):
        """Trigger actions after a learning resource department is created or updated"""

    @hookspec
    def department_delete(self, department):
        """Trigger actions to delete a learning resource department"""

    @hookspec
    def offeror_upserted(self, offeror, overwrite):
        """Trigger actions after a learning resource offeror is created or updated"""

    @hookspec
    def offeror_delete(self, offeror):
        """Trigger actions to delete a learning resource offeror"""


def get_plugin_manager():
    """Return the plugin manager for learning_resources hooks"""
    pm = pluggy.PluginManager(app_config.name)
    pm.add_hookspecs(LearningResourceHooks)
    for module in settings.MITOPEN_LEARNING_RESOURCES_PLUGINS.split(","):
        if module:
            plugin_cls = import_string(module)
            pm.register(plugin_cls())

    return pm
