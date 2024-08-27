"""Management command for populating ocw course completeness scores"""

import csv
from pathlib import Path

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
        parser.add_argument(
            "--skip_calc",
            dest="skip_calc",
            action="store_true",
            help="If set, skip the calculation (just generate csv if desired)",
        )
        parser.add_argument(
            "--csv",
            dest="csv_file",
            required=False,
            help="If set, dump the scores to a csv file",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Populate OCW learning resource completeness scores"""
        course_name = options.get("course_name")
        csv_file = options.get("csv_file")
        start = now_in_utc()
        count = 0
        self.stdout.write("Starting to calculate scores for OCW resources")
        resources = LearningResource.objects.filter(
            etl_source=ETLSource.ocw.name, published=True
        )
        if course_name:
            resources = resources.filter(runs__slug=f"courses/{course_name}")
        if not options.get("skip_calc"):
            for resource in resources:
                calculate_completeness(resource.runs.filter(published=True).first())
                count += 1
                if count % 100 == 0:
                    self.stdout.write(f"Calculated scores for {count} ocw resources")
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                f"{count} ocw scores calculated, took {total_seconds} seconds."
            )
            self.stdout.write("See celery logs for details.")
        if csv_file:
            self.stdout.write(f"Generating CSV file '{csv_file}' of scores")
            with Path.open(csv_file, "w") as csvfile:
                for resource in resources:
                    score_writer = csv.writer(csvfile)
                    score_writer.writerow(
                        [resource.readable_id, resource.url, resource.completeness]
                    )
            self.stdout.write("csv file generated.")
