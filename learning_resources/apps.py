"""learning_resources app config"""

from django.apps import AppConfig


class LearningResourcesConfig(AppConfig):
    """LearningResources Appconfig"""

    name = "learning_resources"

    def ready(self):
        from learning_resources.serializers import schema  # noqa: F401
