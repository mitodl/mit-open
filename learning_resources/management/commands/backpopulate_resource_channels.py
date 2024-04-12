"""Management command to create channels for topics, departments, offerors"""

from django.core.management import BaseCommand

from channels.constants import ChannelType
from learning_resources.hooks import get_plugin_manager
from learning_resources.models import (
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourceTopic,
)
from main.utils import now_in_utc


class Command(BaseCommand):
    """Management command to create channels for topics, departments, offerors"""

    help = "Management command to create channels for topics, departments, offerors"

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            dest="all",
            action="store_true",
            default=True,
            help="Create channels for all types",
        )

        parser.add_argument(
            "--overwrite",
            dest="overwrite",
            action="store_true",
            default=False,
            help="Overwrite existing channels",
        )

        for channeL_type in [
            ChannelType.topic.name,
            ChannelType.department.name,
            ChannelType.offeror.name,
        ]:
            parser.add_argument(
                f"--{channeL_type}",
                dest=channeL_type,
                action="store_true",
                help=f"Create {channeL_type} channels",
            )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002, C901
        """Create channels for topics, departments, offerors"""
        start = now_in_utc()
        pm = get_plugin_manager()
        hook = pm.hook
        overwrite = options["overwrite"]
        self.stdout.write(f"Overwriting existing channels?: {overwrite}")
        if options["all"] or options[ChannelType.department.name]:
            created = 0
            self.stdout.write("Creating department channels")
            for dept in LearningResourceDepartment.objects.all():
                if hook.department_upserted(department=dept, overwrite=overwrite)[0][1]:
                    created += 1
            self.stdout.write(f"Created channels for {created} departments")
        if options["all"] or options[ChannelType.offeror.name]:
            created = 0
            self.stdout.write("Creating offeror channels")
            for offeror in LearningResourceOfferor.objects.all():
                if hook.offeror_upserted(offeror=offeror, overwrite=overwrite)[0][1]:
                    created += 1
            self.stdout.write(f"Finished creating channels for {created} offerors")
        if options["all"] or options[ChannelType.topic.name]:
            created = 0
            self.stdout.write("Creating topic channels")
            for topic in LearningResourceTopic.objects.filter(
                learningresource__isnull=False
            ):
                if hook.topic_upserted(topic=topic, overwrite=overwrite)[0][1]:
                    created += 1
            # Remove topics and channels without any associated learning resources
            for topic in LearningResourceTopic.objects.filter(
                learningresource__isnull=True
            ):
                hook.topic_delete(topic=topic)
            self.stdout.write(f"Finished creating channels for {created} topics")
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Creation of channels finished, took {total_seconds} seconds"
        )
