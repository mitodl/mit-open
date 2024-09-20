"""Management command for populating MIT edX course data"""

from django.core.management import BaseCommand

from learning_resources.etl.constants import ETLSource
from learning_resources.models import LearningResource
from learning_resources.tasks import get_mit_edx_data
from learning_resources.utils import resource_delete_actions
from main.utils import now_in_utc


class Command(BaseCommand):
    """Populate MIT edX courses"""

    help = "Populate MIT edX courses"

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        parser.add_argument(
            "--api_course_datafile",
            dest="api_course_datafile",
            help="If provided, use this file as the source of course API data",
            default=None,
        )
        parser.add_argument(
            "--api_program_datafile",
            dest="api_program_datafile",
            help="If provided, use this file as the source of program API data",
            default=None,
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
                resource_delete_actions(learning_resource)
        else:
            task = get_mit_edx_data.delay(
                options["api_course_datafile"], options["api_program_datafile"]
            )
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
