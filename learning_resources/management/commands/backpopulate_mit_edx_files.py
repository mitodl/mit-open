"""Management command for populating MITx course run file data"""

from django.conf import settings
from django.core.management import BaseCommand

from learning_resources.tasks import import_all_mit_edx_files
from main.utils import now_in_utc


class Command(BaseCommand):
    """Populate MIT edX course run files"""

    help = "Populate MIT edX course run files"

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
        """Run Populate MIT edX course run files"""
        chunk_size = options["chunk_size"]
        task = import_all_mit_edx_files.delay(chunk_size=chunk_size)
        self.stdout.write(f"Started task {task} to get MIT edX course run file data")
        self.stdout.write("Waiting on task...")
        start = now_in_utc()
        task.get()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Population of MIT edX file data finished, took {total_seconds} seconds"
        )
