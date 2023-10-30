"""learning_resources app config"""

from django.apps import AppConfig
from pluggy import HookimplMarker, HookspecMarker


class LearningResourcesConfig(AppConfig):
    """LearningResources Appconfig"""

    name = "learning_resources"
    hookimpl = HookimplMarker(name)
    hookspec = HookspecMarker(name)
