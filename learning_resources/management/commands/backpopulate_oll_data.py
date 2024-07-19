"""Management command for populating oll course data"""

from django.core.management import BaseCommand

from learning_resources.etl.constants import ETLSource
from learning_resources.models import LearningResource
from learning_resources.tasks import get_oll_data
from learning_resources.utils import resource_delete_actions
from main.utils import now_in_utc


class Command(BaseCommand):
    """Populate oll courses"""

    help = "Populate oll courses"

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate oll courses"""

        if options["delete"]:
            self.stdout.write(
                "Deleting all existing OLL courses from database and opensearch"
            )
            for learning_resource in LearningResource.objects.filter(
                etl_source=ETLSource.oll.value
            ):
                resource_delete_actions(learning_resource)
        else:
            task = get_oll_data.delay()
            self.stdout.write(f"Started task {task} to get oll course data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            count = task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                f"Population of oll data finished, took {total_seconds} seconds"
            )
            self.stdout.write(
                f"Populated {count} resources. See celery logs for details."
            )
