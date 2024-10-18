"""Pluggy hooks for authentication"""

import logging

import pluggy
from django.apps import apps
from django.conf import settings
from django.utils.module_loading import import_string

log = logging.getLogger(__name__)

app_config = apps.get_app_config("authentication")
hookspec = app_config.hookspec


class AuthenticationHooks:
    """Pluggy hooks specs for authentication"""

    @hookspec
    def user_created(self, user, user_data):
        """Trigger actions after a user is created"""


def get_plugin_manager():
    """Return the plugin manager for authentication hooks"""
    pm = pluggy.PluginManager(app_config.name)
    pm.add_hookspecs(AuthenticationHooks)
    for module in settings.MITOL_AUTHENTICATION_PLUGINS.split(","):
        if module:
            plugin_cls = import_string(module)
            pm.register(plugin_cls())

    return pm
