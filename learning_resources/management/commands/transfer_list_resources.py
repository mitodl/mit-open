"""Management command for migrating unpublished resource path/list relationships"""

from django.core.management import BaseCommand

from learning_resources.utils import transfer_list_resources
from main.utils import now_in_utc


class Command(BaseCommand):
    """
    Migrate relationships in learningpaths and userlists from unpublished
    resources to published replacement resources.
    """

    help = "Migrate relationships from unpublished resources to published resources."

    def add_arguments(self, parser):
        parser.add_argument(
            "from_resource_type", type=str, help="Resource type to migrate from"
        )
        parser.add_argument(
            "to_resource_type", type=str, help="Resource type to migrate to"
        )
        parser.add_argument(
            "match_field", type=str, help="Resource field to match resources by"
        )
        parser.add_argument(
            "from_source", type=str, help="ETL Source for unpublished resources"
        )
        parser.add_argument(
            "to_source", type=str, help="ETL Source for published resources"
        )
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete unpublished resources after migrating relationships",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """
        Migrate relationships in learningpaths and userlists from unpublished
        resources to published replacement resources.
        """
        from_resource_type = options["from_resource_type"]
        to_resource_type = options["to_resource_type"]
        match_field = options["match_field"]
        from_source = options["from_source"]
        to_source = options["to_source"]
        delete = options["delete"]

        self.stdout.write(
            f"Migrate {from_resource_type} relationships from {from_source}"
            f" to {to_resource_type}:{to_source}, matching on {match_field}"
        )
        start = now_in_utc()
        unpublished, matching = transfer_list_resources(
            from_resource_type,
            to_resource_type,
            match_field,
            from_source,
            to_source,
            delete_unpublished=delete,
        )
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Processed {unpublished} resources and found {matching} "
            f"published matches, took {total_seconds} seconds"
        )
