"""Management command to update learning resource content"""

from django.core.management.base import BaseCommand, CommandError

from learning_resources.etl.constants import ETLSource
from learning_resources_search.constants import ALL_INDEX_TYPES, CONTENT_FILE_TYPE
from learning_resources_search.tasks import start_update_index
from main.utils import now_in_utc

valid_object_types = [*list(ALL_INDEX_TYPES), CONTENT_FILE_TYPE]


class Command(BaseCommand):
    """Indexes opensearch content"""

    def add_arguments(self, parser):
        allowed_etl_sources = [
            etl_source.value
            for etl_source in ETLSource
            if etl_source.value not in [ETLSource.podcast.value]
        ]

        parser.add_argument(
            "--all", dest="all", action="store_true", help="Update all indexes"
        )

        for object_type in sorted(valid_object_types):
            parser.add_argument(
                f"--{object_type}s",
                dest=object_type,
                action="store_true",
                help=f"Update the {object_type} index",
            )

        parser.add_argument(
            "--course_etl_source",
            action="store",
            dest="etl_source",
            default=None,
            choices=allowed_etl_sources,
            help="Filter courses and course files update by etl_source.",
        )

        super().add_arguments(parser)

    def handle(self, **options):
        """Index the comments and posts for the channels the user is subscribed to"""

        if options["all"]:
            task = start_update_index.delay(valid_object_types, options["etl_source"])
            self.stdout.write(
                f"Started celery task {task} to update index content for all indexes"
            )
            if options["etl_source"]:
                self.stdout.write(
                    "".join(
                        [
                            "Only updating course and course document indexes for",
                            f" {options['etl_source']}",
                        ]
                    )
                )
        else:
            indexes_to_update = list(
                filter(lambda object_type: options[object_type], valid_object_types)
            )
            if not indexes_to_update:
                self.stdout.write("Must select at least one index to update")
                self.stdout.write("The following are valid index options:")
                self.stdout.write("  --all")
                for object_type in sorted(valid_object_types):
                    self.stdout.write(f"  --{object_type}s")
                return

            task = start_update_index.delay(indexes_to_update, options["etl_source"])
            self.stdout.write(
                "".join(
                    [
                        f"Started celery task {task} to update index content for the ",
                        f"following indexes: {indexes_to_update}",
                    ]
                )
            )

            if options["etl_source"]:
                self.stdout.write(
                    "".join(
                        [
                            "Only updating course and course document indexes for ",
                            f" {options['etl_source']}",
                        ]
                    )
                )

        self.stdout.write("Waiting on task...")
        start = now_in_utc()
        errors = task.get()
        if errors:
            errors = [error for error in errors if error is not None]
            msg = f"Update index errored: {errors}"
            raise CommandError(msg)

        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(f"Update index finished, took {total_seconds} seconds")
