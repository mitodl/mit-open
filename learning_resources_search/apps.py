"""Search app config"""

from django.apps import AppConfig
from pluggy import HookimplMarker, HookspecMarker


class SearchAppConfig(AppConfig):
    """Search app config"""

    name = "learning_resources_search"
    hookimpl = HookimplMarker(name)
    hookspec = HookspecMarker(name)

    def ready(self):
        """Application is ready"""
        from learning_resources_search import connection

        connection.configure_connections()
