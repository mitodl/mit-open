"""Management command to index content"""

from django.core.management.base import BaseCommand, CommandError

from learning_resources_search.constants import ALL_INDEX_TYPES
from learning_resources_search.indexing_api import get_existing_reindexing_indexes
from learning_resources_search.tasks import start_recreate_index
from main.utils import now_in_utc


class Command(BaseCommand):
    """Indexes content"""

    help = "Recreate opensearch index"

    def add_arguments(self, parser):
        parser.add_argument(
            "--remove_existing_reindexing_tags",
            dest="remove_existing_reindexing_tags",
            action="store_true",
            help="Overwrite any existing reindexing tags and remove those indexes",
        )

        parser.add_argument(
            "--all", dest="all", action="store_true", help="Recreate all indexes"
        )

        for object_type in sorted(ALL_INDEX_TYPES):
            parser.add_argument(
                f"--{object_type}s",
                dest=object_type,
                action="store_true",
                help=f"Recreate the {object_type} index",
            )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Index all LEARNING_RESOURCE_TYPES"""
        remove_existing_reindexing_tags = options["remove_existing_reindexing_tags"]
        if options["all"]:
            indexes_to_update = list(ALL_INDEX_TYPES)
        else:
            indexes_to_update = list(
                filter(lambda object_type: options[object_type], ALL_INDEX_TYPES)
            )
            if not indexes_to_update:
                self.stdout.write("Must select at least one index to update")
                self.stdout.write("The following are valid index options:")
                self.stdout.write("  --all")
                for object_type in sorted(ALL_INDEX_TYPES):
                    self.stdout.write(f"  --{object_type}s")
                return
        if not remove_existing_reindexing_tags:
            existing_reindexing_indexes = get_existing_reindexing_indexes(
                indexes_to_update
            )
            if existing_reindexing_indexes:
                self.stdout.write(
                    f"Reindexing in progress. Reindexing indexes already exist:"
                    f" {', '.join(existing_reindexing_indexes)}"
                )
                return

        task = start_recreate_index.delay(
            indexes_to_update, remove_existing_reindexing_tags
        )
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
