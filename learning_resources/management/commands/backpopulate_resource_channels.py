"""Management command to create channels for topics, departments, offerors"""

import json
from pathlib import Path

from django.conf import settings
from django.core.management import BaseCommand

from channels.constants import ChannelType
from channels.models import Channel
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
            default=False,
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
            ChannelType.unit.name,
        ]:
            parser.add_argument(
                f"--{channeL_type}",
                dest=channeL_type,
                action="store_true",
                help=f"Create {channeL_type} channels",
            )
        super().add_arguments(parser)

    def get_offeror_template_config(self):
        with Path.open(
            settings.BASE_DIR
            + "/learning_resources/data/channel_templates/offerors.json"
        ) as f:
            return json.load(f)

    def set_default_offeror_template(self, offeror_code):
        offeror_template_config = self.get_offeror_template_config()
        template_conf = offeror_template_config.get(offeror_code)
        if (
            template_conf
            and Channel.objects.filter(
                unit_detail__unit__code=offeror_code,
                channel_type="unit",
            ).exists()
        ):
            channel = Channel.objects.get(
                unit_detail__unit__code=offeror_code,
                channel_type="unit",
            )
            channel.configuration.update(template_conf)
            channel.save()

    def handle(self, *args, **options):  # noqa: ARG002
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
        if options["all"] or options[ChannelType.unit.name]:
            created = 0
            self.stdout.write("Creating offeror channels")
            for offeror in LearningResourceOfferor.objects.all():
                if hook.offeror_upserted(offeror=offeror, overwrite=overwrite)[0][1]:
                    created += 1
                    self.set_default_offeror_template(offeror.code)

            self.stdout.write(f"Finished creating channels for {created} offerors")
        if options["all"] or options[ChannelType.topic.name]:
            created = 0
            self.stdout.write("Creating topic channels")
            for topic in LearningResourceTopic.objects.filter(
                learningresource__isnull=False
            ):
                if hook.topic_upserted(topic=topic, overwrite=overwrite)[0][1]:
                    created += 1
            self.stdout.write(f"Finished creating channels for {created} topics")
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Creation of channels finished, took {total_seconds} seconds"
        )
