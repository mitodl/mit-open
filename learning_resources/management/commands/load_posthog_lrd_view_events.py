"""Management command to run the PostHog lrd_view pipeline."""

from django.core.management import BaseCommand

from learning_resources.etl.pipelines import posthog_etl
from learning_resources.models import LearningResourceViewEvent


class Command(BaseCommand):
    """Run the PostHog ETL pipeline to import Learning Resource view events."""

    help = "Run the PostHog ETL pipeline to import Learning Resource view events."

    def handle(self, *args, **kwargs):  # noqa: ARG002
        """Run the PostHog ETL pipeline to import Learning Resource view events."""

        self.stdout.write("Running the ETL pipeline...")

        posthog_etl()

        ev_count = LearningResourceViewEvent.objects.count()

        self.stdout.write(f"Completed. {ev_count} view events total.")
