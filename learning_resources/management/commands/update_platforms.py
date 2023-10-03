"""Management command for populating LearningResourcePlatform data"""
import json
from pathlib import Path

from django.core.management import BaseCommand
from django.db import transaction

from learning_resources.models import LearningResourcePlatform
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourcePlatform data"""

    help = "Update LearningResourcePlatform data"  # noqa: A003

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourcePlatform data"""

        self.stdout.write("Updating platform data")
        start = now_in_utc()
        with Path.open(
            Path(__file__).parent.parent.parent / "fixtures" / "platforms.json"
        ) as inf:
            platform_json = json.load(inf)
            platforms = []
            with transaction.atomic():
                for platform in platform_json:
                    platform_fields = platform["fields"]
                    LearningResourcePlatform.objects.update_or_create(
                        platform=platform_fields["platform"],
                        defaults=platform_fields,
                    )
                    platforms.append(platform_fields["platform"])
                LearningResourcePlatform.objects.exclude(
                    platform__in=platforms
                ).delete()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(f"Update of platforms finished, took {total_seconds} seconds")
