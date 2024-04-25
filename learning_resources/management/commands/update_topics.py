"""Management command for populating LearningResourceTopic data"""

from django.core.management import BaseCommand

from learning_resources.utils import upsert_topic_data
from main.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourceTopic data"""

    help = "Update LearningResourceTopic data"

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceTopic data"""

        self.stdout.write("Updating topic data")
        start = now_in_utc()
        topic_codes = upsert_topic_data()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Upserted {len(topic_codes)} topics, took {total_seconds} seconds"
        )
