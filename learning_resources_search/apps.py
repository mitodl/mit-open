"""Search app config"""
from django.apps import AppConfig


class SearchAppConfig(AppConfig):
    """Search app config"""

    name = "learning_resources_search"

    def ready(self):
        """Application is ready"""
        from learning_resources_search import connection

        connection.configure_connections()
