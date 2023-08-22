"""Management command for populating xpro course data"""
from django.core.management import BaseCommand

from learning_resources.constants import PlatformType
from learning_resources.models import Course
from learning_resources.tasks import get_xpro_data
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Populate xpro courses"""

    help = "Populate xpro courses"

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):
        """Run Populate xpro courses"""
        if options["delete"]:
            self.stdout.write(
                "Deleting all existing xPro courses from database and opensearch"
            )
            for learning_resources in LearningResource.objects.filter(
                platform__platform=PlatformType.xpro.value
            ):
                learning_resources.delete()
        else:
            task = get_xpro_data.delay()
            self.stdout.write(f"Started task {task} to get xpro course data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                "Population of xpro data finished, took {} seconds".format(
                    total_seconds
                )
            )
