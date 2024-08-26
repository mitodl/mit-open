"""Management command to update learning resource content"""

from django.core.management.base import BaseCommand

from learning_resources_search.utils import realign_channel_subscriptions


class Command(BaseCommand):
    """
    Removes duplicate Percolate Queries and consolidates users
    to the real instance when search parameters change
    """

    def handle(self, **options):  # noqa: ARG002
        realign_channel_subscriptions()
