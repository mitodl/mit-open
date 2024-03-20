"""Management command for populating MIT news/events items"""

from django.core.management import BaseCommand

from news_events.etl import pipelines
from news_events.models import FeedImage, FeedSource


class Command(BaseCommand):
    """Populate MIT news and events"""

    help = """Populates MIT news/events sources and items"""

    def add_arguments(self, parser):
        """Configure arguments for this command"""
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing sources/items first",
        )

        parser.add_argument(
            "-p",
            "--pipelines",
            dest="pipelines",
            action="append",
            default=None,
            help="Only run pipelines specified by name",
        )

        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run some or all of the MIT news/events ETL pipelines"""
        delete = options["delete"]
        etl_funcs = options["pipelines"] or [
            func for func in dir(pipelines) if func.endswith("_etl")
        ]
        if delete:
            self.stdout.write("Deleting all existing MIT news/events sources and items")
            FeedSource.objects.all().delete()
            FeedImage.objects.all().delete()
            self.stdout.write("All MIT news/events sources and items have been deleted")
        else:
            for etl_func in etl_funcs:
                self.stdout.write(f"Running {etl_func} pipeline")
                getattr(pipelines, etl_func)()
        self.stdout.write("Finished running news/events ETL pipelines")
