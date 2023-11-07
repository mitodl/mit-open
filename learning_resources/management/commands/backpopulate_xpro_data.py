"""Management command for populating xpro course data"""

from django.core.management import BaseCommand

from learning_resources.constants import LearningResourceType
from learning_resources.etl.constants import ETLSource
from learning_resources.models import LearningResource
from learning_resources.tasks import get_xpro_data
from learning_resources_search import search_index_helpers
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Populate xpro courses"""

    help = "Populate xpro courses"  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate xpro courses"""
        if options["delete"]:
            self.stdout.write(
                "Deleting all existing xPro courses from database and opensearch"
            )

            for course in LearningResource.objects.filter(
                etl_source=ETLSource.xpro.name,
                resource_type=LearningResourceType.course.name,
            ):
                search_index_helpers.deindex_course(course)

            for program in LearningResource.objects.filter(
                etl_source=ETLSource.xpro.name,
                resource_type=LearningResourceType.program.name,
            ):
                search_index_helpers.deindex_program(program)

            for learning_resources in LearningResource.objects.filter(
                etl_source=ETLSource.xpro.name
            ):
                learning_resources.delete()
        else:
            task = get_xpro_data.delay()
            self.stdout.write(f"Started task {task} to get xpro course data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            count = task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                f"Population of xpro data finished, took {total_seconds} seconds"
            )
            self.stdout.write(
                f"Populated {count} resources. See celery logs for details."
            )
