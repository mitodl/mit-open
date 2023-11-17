"""learning_resources app config"""

from django.apps import AppConfig
from pluggy import HookimplMarker, HookspecMarker


class LearningResourcesConfig(AppConfig):
    """LearningResources Appconfig"""

    name = "learning_resources"
    hookimpl = HookimplMarker(name)
    hookspec = HookspecMarker(name)

    def ready(self):
        from learning_resources import schema  # noqa: F401
