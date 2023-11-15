"""Management command for populating micromasters course data"""

from django.core.management import BaseCommand

from learning_resources.etl.constants import ETLSource
from learning_resources.models import LearningResource
from learning_resources.tasks import get_micromasters_data
from learning_resources.utils import resource_delete_actions
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Populate micromasters programs and courses"""

    help = "Populate micromasters programs and courses"  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing programs",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Populate micromasters courses"""
        if options["delete"]:
            self.stdout.write(
                "Deleting all existing Micromasters programs from database and search"
            )
            # we only delete programs; courses are owned by the MIT edX integration
            for program in LearningResource.objects.filter(
                etl_source=ETLSource.micromasters.value
            ):
                resource_delete_actions(program)
        else:
            task = get_micromasters_data.delay()
            self.stdout.write(f"Started task {task} to get micromasters course data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            count = task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                "Population of micromasters data finished, took {} seconds".format(
                    total_seconds
                )
            )
            self.stdout.write(
                f"Populated {count} resources. See celery logs for details."
            )
