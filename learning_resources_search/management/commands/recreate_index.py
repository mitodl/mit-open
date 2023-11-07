"""Management command to index content"""

from django.core.management.base import BaseCommand, CommandError

from learning_resources_search.constants import VALID_OBJECT_TYPES
from learning_resources_search.tasks import start_recreate_index
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Indexes content"""

    help = "Recreate opensearch index"  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--all", dest="all", action="store_true", help="Recreate all indexes"
        )

        for object_type in sorted(VALID_OBJECT_TYPES):
            parser.add_argument(
                f"--{object_type}s",
                dest=object_type,
                action="store_true",
                help=f"Recreate the {object_type} index",
            )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Index all VALID_OBJECT_TYPES"""
        if options["all"]:
            task = start_recreate_index.delay(list(VALID_OBJECT_TYPES))
            self.stdout.write(
                f"Started celery task {task} to index content for all indexes"
            )
        else:
            indexes_to_update = list(
                filter(lambda object_type: options[object_type], VALID_OBJECT_TYPES)
            )
            if not indexes_to_update:
                self.stdout.write("Must select at least one index to update")
                self.stdout.write("The following are valid index options:")
                self.stdout.write("  --all")
                for object_type in sorted(VALID_OBJECT_TYPES):
                    self.stdout.write(f"  --{object_type}s")
                return

            task = start_recreate_index.delay(indexes_to_update)
            self.stdout.write(
                f"Started celery task {task} to index content for the following"
                f" indexes: {indexes_to_update}"
            )

        self.stdout.write("Waiting on task...")
        start = now_in_utc()
        error = task.get()
        if error:
            msg = f"Recreate index errored: {error}"
            raise CommandError(msg)

        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(f"Recreate index finished, took {total_seconds} seconds")
