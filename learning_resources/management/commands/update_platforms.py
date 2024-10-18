"""Management command for populating LearningResourcePlatform data"""

from django.core.management import BaseCommand

from data_fixtures.utils import upsert_platform_data
from main.utils import clear_search_cache, now_in_utc


class Command(BaseCommand):
    """Update LearningResourcePlatform data"""

    help = "Update LearningResourcePlatform data"

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourcePlatform data"""

        self.stdout.write("Updating platform data")
        start = now_in_utc()
        platform_codes = upsert_platform_data()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Upserted {len(platform_codes)} platforms, took {total_seconds} seconds"
        )
        clear_search_cache()
