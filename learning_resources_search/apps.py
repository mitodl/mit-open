"""Search app config"""

from django.apps import AppConfig


class SearchAppConfig(AppConfig):
    """Search app config"""

    name = "learning_resources_search"

    def ready(self):
        """Application is ready"""
        from learning_resources_search import (
            connection,
            signals,  # noqa: F401
        )

        connection.configure_connections()
