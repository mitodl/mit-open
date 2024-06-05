"""Management command for populating OLL course run file data"""

from django.core.management import BaseCommand

from learning_resources.tasks import import_all_oll_files
from main import settings
from main.utils import now_in_utc


class Command(BaseCommand):
    """Populate OLL course run files"""

    help = "Populate OLL course run files"

    def add_arguments(self, parser):
        parser.add_argument(
            "-c",
            "--chunk-size",
            dest="chunk_size",
            default=settings.LEARNING_COURSE_ITERATOR_CHUNK_SIZE,
            type=int,
            help="Chunk size for batch import task",
        )

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate OLL course run files"""
        chunk_size = options["chunk_size"]
        task = import_all_oll_files.delay(chunk_size=chunk_size)
        self.stdout.write(f"Started task {task} to get OLL course run file data")
        self.stdout.write("Waiting on task...")
        start = now_in_utc()
        task.get()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Population of OLL file data finished, took {total_seconds} seconds"
        )
