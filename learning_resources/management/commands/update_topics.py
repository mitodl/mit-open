"""
Management command for populating LearningResourceTopic data, either from the
default location or from an update file.

The topics file data should be in the format described in the README-topics.md
in the data folder.

Use this for testing - if you need to push out changes to the data, roll the
change into a migration in the data_fixtures app.
"""

from pathlib import Path

from django.core.management import BaseCommand

from learning_resources.models import LearningResourceTopic
from learning_resources.utils import dump_topics_to_yaml, upsert_topic_data_file
from main.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourceTopic data"""

    help = (
        "Update LearningResourceTopic data from a yaml file. Optionally "
        "dump the updated topics to a file."
    )

    def add_arguments(self, parser):
        """Add arguments to the command"""

        parser.add_argument(
            "--file",
            dest="topics_file",
            default=None,
            nargs="?",
            help="Specify path to the topic file",
        )
        parser.add_argument(
            "--output-file",
            dest="topics_output_file",
            default=None,
            nargs="?",
            help="Specify path to write the topics file to",
        )

        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceTopic data"""

        self.stdout.write(
            f"Updating topic data from {options['topics_file'] or 'default location'}"
        )
        start = now_in_utc()
        upsert_topic_data_file(options["topics_file"]) if options[
            "topics_file"
        ] else upsert_topic_data_file()
        topic_count = LearningResourceTopic.objects.count()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Upserted {topic_count} topics, took {total_seconds} seconds"
        )

        if "topics_output_file" in options:
            with Path.open(options["topics_output_file"], "w") as outfile:
                outfile.write(dump_topics_to_yaml())
            self.stdout.write(f"Wrote topics to {options['topics_output_file']}.")
