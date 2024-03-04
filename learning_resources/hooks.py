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
    """Pluggy hooks specs for authentication"""

    @hookspec
    def resource_upserted(self, resource):
        """Trigger actions after a learning resource is created or updated"""

    @hookspec
    def resource_unpublished(self, resource):
        """Trigger actions after a learning resource is unpublished"""

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


def get_plugin_manager():
    """Return the plugin manager for learning_resources hooks"""
    pm = pluggy.PluginManager(app_config.name)
    pm.add_hookspecs(LearningResourceHooks)
    for module in settings.MITOPEN_LEARNING_RESOURCES_PLUGINS.split(","):
        if module:
            plugin_cls = import_string(module)
            pm.register(plugin_cls())

    return pm
