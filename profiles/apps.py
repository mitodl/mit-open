"""Profile app config"""

from django.apps import AppConfig


class ProfilesConfig(AppConfig):
    """Profiles Appconfig"""

    name = "profiles"

    def ready(self):
        """
        Ready handler. Import signals.
        """
        from profiles import schema  # noqa: F401
