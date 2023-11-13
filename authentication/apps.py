"""Authentication Apps"""

from django.apps import AppConfig
from pluggy import HookimplMarker, HookspecMarker


class AuthenticationConfig(AppConfig):
    """Authentication AppConfig"""

    name = "authentication"

    hookimpl = HookimplMarker(name)
    hookspec = HookspecMarker(name)
