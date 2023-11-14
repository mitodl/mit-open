"""apps for channels"""

from django.apps import AppConfig


class ChannelsConfig(AppConfig):
    """Config for ChannelsConfig"""

    name = "channels"

    def ready(self):
        """
        Ready handler. Import signals.
        """
        import channels.signals  # noqa: F401
