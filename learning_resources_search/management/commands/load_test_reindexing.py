"""Management command to simulate a large number of learning resource updates"""

import random

from django.core.management.base import BaseCommand
from django.db.models import Max

from learning_resources.models import LearningResource
from learning_resources.utils import resource_upserted_actions


class Command(BaseCommand):
    """Load tests learning resource updates"""

    help = "Load test learning resource updates"

    def add_arguments(self, parser):
        parser.add_argument(
            "--rate--limit", dest="rate_limit", help="Rate limit for upsert requests"
        )

        parser.add_argument(
            "--percolate",
            dest="percolate",
            action="store_true",
            default=False,
            help="Trigger percolate updates as well",
        )

        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Load test learning resource updates"""
        count = options["count"]
        percolate = options["percolate"]

        max_id = LearningResource.objects.aggregate(max_id=Max("id"))["max_id"]

        for _ in range(count):
            random_id = random.randint(1, max_id)  # noqa: S311
            lr = LearningResource.objects.filter(id=random_id).first()
            if lr is not None:
                self.stdout.write(f"Updating learning resource id: {random_id}")
                resource_upserted_actions(lr, percolate)
