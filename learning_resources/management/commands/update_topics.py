"""Management command for populating LearningResourceTopic data"""

from django.core.management import BaseCommand

from learning_resources.models import LearningResourceTopic
from learning_resources.utils import upsert_topic_data
from main.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourceTopic data"""

    help = "Update LearningResourceTopic data"

    def add_arguments(self, parser):
        """Add arguments to the command"""

        parser.add_argument(
            "--ocw-file",
            dest="ocw_file",
            default=None,
            nargs="?",
            help="Specify path to the OCW course site config file (defaults to"
            " learning_resources/data/ocw-course-site-config.json)",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceTopic data"""

        self.stdout.write(
            f"Updating topic data from {options['ocw_file'] or 'default location'}"
        )
        start = now_in_utc()
        upsert_topic_data(options["ocw_file"]) if options[
            "ocw_file"
        ] else upsert_topic_data()
        topic_count = LearningResourceTopic.objects.count()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Upserted {topic_count} topics, took {total_seconds} seconds"
        )
