"""Management command to update learning resource content"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Indexes opensearch content"""

    def handle(self, **options):
        """Index the comments and posts for the channels the user is subscribed to"""
