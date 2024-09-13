"""Management command for populating LearningResourceOfferor data"""

from django.core.management import BaseCommand

from learning_resources.utils import upsert_offered_by_data
from main.utils import clear_cache, now_in_utc


class Command(BaseCommand):
    """Update LearningResourceOfferor data"""

    help = "Update LearningResourceOfferor data"

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceOfferor data"""

        self.stdout.write("Updating offered_by data")
        start = now_in_utc()
        offerors = upsert_offered_by_data()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Update of {len(offerors)} offerors finished, took {total_seconds} seconds"
        )
        clear_cache()
