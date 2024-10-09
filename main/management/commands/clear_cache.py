"""Command to generate the channel avatar SVGs"""

from django.core.management.base import BaseCommand

from main.utils import clear_search_cache


class Command(BaseCommand):
    """Command to generate the channel avatar SVGs"""

    help = "Command to clear the cache"

    def handle(self, *args, **options):  # noqa: ARG002
        cache_items = clear_search_cache()
        self.stdout.write(f"cleared {cache_items} items from cache")
