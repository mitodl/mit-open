"""Management command for populating MIT edX course data"""
from django.core.management import BaseCommand

from learning_resources.etl.constants import ETLSource
from learning_resources.models import LearningResource
from learning_resources.tasks import get_mit_edx_data
from open_discussions.utils import now_in_utc
from search.search_index_helpers import deindex_course


class Command(BaseCommand):
    """Populate MIT edX courses"""

    help = "Populate MIT edX courses"  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate edx courses"""
        if options["delete"]:
            self.stdout.write(
                "Deleting all existing MIT edX courses from database and opensearch"
            )
            for learning_resource in LearningResource.objects.filter(
                etl_source=ETLSource.mit_edx.value
            ):
                learning_resource.delete()
                deindex_course(learning_resource)
        else:
            task = get_mit_edx_data.delay()
            self.stdout.write(f"Started task {task} to get MIT edX course data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            count = task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                f"Population of MIT edX data finished, took {total_seconds} seconds"
            )
            self.stdout.write(
                f"Populated {count} resources. See celery logs for details."
            )
