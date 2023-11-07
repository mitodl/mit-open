"""Management command for populating LearningResourcePlatform data"""

from django.core.management import BaseCommand

from learning_resources.utils import upsert_platform_data
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourcePlatform data"""

    help = "Update LearningResourcePlatform data"  # noqa: A003

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourcePlatform data"""

        self.stdout.write("Updating platform data")
        start = now_in_utc()
        upsert_platform_data()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(f"Update of platforms finished, took {total_seconds} seconds")
