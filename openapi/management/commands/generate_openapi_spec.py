"""
Management command to generate OpenAPI specs from our APIs.
"""
from pathlib import Path

from django.conf import settings
from django.core import management
from django.core.management import BaseCommand


def generate_openapi_spec(version, file: str | None = None):
    management.call_command(
        "spectacular",
        urlconf="open_discussions.urls",
        file=file,
        validate=True,
        api_version=version,
    )


class Command(BaseCommand):
    """Generate OpenAPI specs for our APIs."""

    help = "Generate OpenAPI specs for our APIs."  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--directory",
            dest="directory",
            default="openapi/specs/",
            help="Directory into which output is written",
        )

        super().add_arguments(parser)

    def handle(self, **options):
        directory = options["directory"]
        for version in settings.REST_FRAMEWORK["ALLOWED_VERSIONS"]:
            filename = version + ".yaml"
            filepath = Path(directory) / filename
            generate_openapi_spec(version, filepath)
