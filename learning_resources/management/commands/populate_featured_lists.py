"""Management command to create dev-only featured lists for offeror channels"""

import sys

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management import BaseCommand

from channels.models import FieldChannel
from learning_resources.constants import (
    FEATURED_OFFERORS,
    LearningResourceRelationTypes,
    LearningResourceType,
)
from learning_resources.models import LearningPath, LearningResource
from main.utils import now_in_utc


class Command(BaseCommand):
    """create dev-only featured lists for offeror channels"""

    help = "create dev-only featured lists for offeror channelsr"

    def add_arguments(self, parser):
        parser.add_argument(
            "resource_count",
            nargs="?",
            type=int,
            default=10,
            help="Set the number of courses per featured list (default is 10)",
        )

    def handle(self, *args, **options):  # noqa: ARG002
        """Create a Favorites userlist for every active user"""
        if settings.ENVIRONMENT == "production":
            self.stderr.write("This command is only available in dev/rc environments")
            sys.exit(1)

        self.stdout.write("Creating featured list for each featured offeror channel")

        start = now_in_utc()
        resource_count = options.get("resource_count", 10)
        for featured_offeror in FEATURED_OFFERORS:
            self.stdout.write(
                f"Creating featured list for {featured_offeror.value} channel"
            )

            # Get the channel for the offeror
            offeror_channel = FieldChannel.objects.filter(
                offeror_detail__offeror__code=featured_offeror.name
            ).first()
            if not offeror_channel:
                self.stderr.write(
                    f"{featured_offeror.value} channel not found, run backpopulate_resource_channels"  # noqa: E501
                )
                sys.exit(1)

            # Create learning path resource for the offeror
            learning_path, _ = LearningResource.objects.get_or_create(
                title=f"{featured_offeror.value} Featured Resources",
                resource_type=LearningResourceType.learning_path.name,
            )
            LearningPath.objects.get_or_create(
                learning_resource=learning_path,
                author=User.objects.first(),
            )

            # Assign x courses to the learning path
            learning_path.resources.clear()
            for idx, resource in enumerate(
                LearningResource.objects.filter(
                    published=True,
                    offered_by=featured_offeror.name,
                    resource_type=LearningResourceType.course.name,
                )[:resource_count]
            ):
                learning_path.resources.add(
                    resource,
                    through_defaults={
                        "relation_type": LearningResourceRelationTypes.LEARNING_PATH_ITEMS,  # noqa: E501
                        "position": idx,
                    },
                )

            # Assign the learning path as the offeror channel's featured list
            offeror_channel.featured_list = learning_path
            offeror_channel.save()

        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            "Population of offeror channel featured lists finished, "
            f"took {total_seconds} seconds"
        )
