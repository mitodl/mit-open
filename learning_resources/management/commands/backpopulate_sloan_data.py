"""Management command for populating professional education course/program data"""

from django.core.management import BaseCommand

from learning_resources.etl.constants import ETLSource
from learning_resources.models import LearningResource
from learning_resources.tasks import get_sloan_data
from learning_resources.utils import resource_delete_actions
from main.utils import now_in_utc


class Command(BaseCommand):
    """Populate professional education  courses"""

    help = "Populate Sloan Executive Education courses"

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate Sloan Executive Education courses"""
        if options["delete"]:
            self.stdout.write(
                "Deleting all existing Prof. Ed. courses from database and opensearch"
            )
            for resource in LearningResource.objects.filter(
                etl_source=ETLSource.see.value
            ):
                resource_delete_actions(resource)
        else:
            task = get_sloan_data.delay()
            self.stdout.write(f"Started task {task} to get Sloan course/program data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            count = task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                f"Population of Sloan data finished, took {total_seconds} seconds"
            )
            self.stdout.write(
                f"Populated {count} resources. See celery logs for details."
            )
