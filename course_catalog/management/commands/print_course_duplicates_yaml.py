"""Management command for uploading master json data for OCW courses"""
from django.core.management import BaseCommand

from course_catalog.etl.deduplication import generate_duplicates_yaml


class Command(BaseCommand):
    """Print course duplicates yaml"""

    help = "Print course duplicates yaml"  # noqa: A003

    def handle(self, *args, **options):  # noqa: ARG002
        self.stdout.write(generate_duplicates_yaml())
