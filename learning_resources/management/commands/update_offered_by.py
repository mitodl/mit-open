"""Management command for populating LearningResourceOfferor data"""
from django.core.management import BaseCommand

from learning_resources.utils import upsert_offered_by_data
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourceOfferor data"""

    help = "Update LearningResourceOfferor data"  # noqa: A003

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceOfferor data"""

        self.stdout.write("Updating offered_by data")
        start = now_in_utc()
        upsert_offered_by_data()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(f"Update of offerors finished, took {total_seconds} seconds")
