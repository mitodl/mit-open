"""Management command for populating oll course data"""

import json
from pathlib import Path

from django.core.management import BaseCommand

from learning_resources.etl import mit_edx, oll
from learning_resources.etl.constants import ETLSource
from main.utils import now_in_utc

EXTRACTORS = {
    ETLSource.oll.name: oll.extract,
    ETLSource.mit_edx.name: mit_edx.extract,
}


def extract_data(etl_source):
    """Extract data from the given source"""

    return EXTRACTORS[etl_source]()


class Command(BaseCommand):
    """Populate oll courses"""

    help = "Populate oll courses"

    def add_arguments(self, parser):
        parser.add_argument(
            "--etl_source",
            dest="etl_source",
            required=True,
            choices=list(EXTRACTORS),
            help="The ETL source data to extract",
        )
        parser.add_argument(
            "--output",
            dest="outfile",
            required=True,
            help="The ETL source data to extract",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate oll courses"""
        etl_source = options["etl_source"]
        outfile = options["outfile"]
        self.stdout.write(f"Starting to get {etl_source} course data")
        start = now_in_utc()
        data = extract_data(etl_source)
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Extraction of {etl_source} data finished, took {total_seconds} seconds"
        )
        self.stdout.write(f"Writing data to {outfile}")
        with Path(outfile).open("w") as f:
            json.dump(data, f)
        self.stdout.write(f"Data written to {outfile}")
