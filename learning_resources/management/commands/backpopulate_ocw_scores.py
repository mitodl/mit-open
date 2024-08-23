"""Management command for populating ocw course completeness scores"""

from django.core.management import BaseCommand

from learning_resources.etl.constants import ETLSource
from learning_resources.etl.loaders import calculate_completeness
from learning_resources.models import LearningResource
from main.utils import now_in_utc


class Command(BaseCommand):
    """Populate OCW learning resource completeness scores"""

    help = "Populate OCW learning resource completeness scores"

    def add_arguments(self, parser):
        parser.add_argument(
            "--course-name",
            dest="course_name",
            required=False,
            help="If set,backpopulate only the course with this ocw-studio name",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Populate OCW learning resource completeness scores"""
        course_name = options.get("course_name")
        start = now_in_utc()
        count = 0
        self.stdout.write("Starting to calculate scores for OCW resources")
        resources = LearningResource.objects.filter(
            etl_source=ETLSource.ocw.name, published=True
        )
        if course_name:
            resources = resources.filter(runs__slug=f"courses/{course_name}")
        for resource in resources:
            calculate_completeness(resource.runs.filter(published=True).first())
            count += 1
            if count % 100 == 0:
                self.stdout.write(f"Calculated scores for {count} ocw resources")
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"{count} ocw completeness scores calculated, took {total_seconds} seconds."
        )
        self.stdout.write("See celery logs for details.")
