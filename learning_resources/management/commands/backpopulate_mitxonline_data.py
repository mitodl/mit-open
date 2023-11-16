"""Management command for populating mitxonline course data"""

from django.core.management import BaseCommand

from learning_resources.etl.constants import ETLSource
from learning_resources.models import LearningResource
from learning_resources.tasks import get_mitxonline_data
from learning_resources.utils import resource_delete_actions
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Populate mitxonline courses"""

    help = "Populate mitxonline courses"  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate mitxonline courses"""
        if options["delete"]:
            self.stdout.write(
                "Deleting all existing xPro courses from database and opensearch"
            )
            for learning_resource in LearningResource.objects.filter(
                etl_source=ETLSource.mitxonline.value
            ):
                resource_delete_actions(learning_resource)
        else:
            task = get_mitxonline_data.delay()
            self.stdout.write(f"Started task {task} to get MITx Online course data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            count = task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                f"Population of MITX Online data finished, took {total_seconds} seconds"
            )
            self.stdout.write(
                f"Populated {count} resources. See celery logs for details."
            )
