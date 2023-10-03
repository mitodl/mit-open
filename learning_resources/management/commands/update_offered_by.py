"""Management command for populating LearningResourceOfferor data"""
import json
from pathlib import Path

from django.core.management import BaseCommand
from django.db import transaction

from learning_resources.models import LearningResourceOfferor
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourceOfferor data"""

    help = "Update LearningResourceOfferor data"  # noqa: A003

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceOfferor data"""

        self.stdout.write("Updating offered_by data")
        start = now_in_utc()
        with Path.open(
            Path(__file__).parent.parent.parent / "fixtures" / "offered_by.json"
        ) as inf:
            offered_by_json = json.load(inf)
            offerors = []
            with transaction.atomic():
                for offeror in offered_by_json:
                    offeror_fields = offeror["fields"]
                    LearningResourceOfferor.objects.update_or_create(
                        name=offeror_fields["name"],
                        defaults=offeror_fields,
                    )
                    offerors.append(offeror_fields["name"])
                LearningResourceOfferor.objects.exclude(name__in=offerors).delete()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(f"Update of offerors finished, took {total_seconds} seconds")
