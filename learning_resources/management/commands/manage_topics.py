"""Management command for managing LearningResourceTopic data"""

from django.core.management import BaseCommand

from learning_resources.models import LearningResourceTopic


class Command(BaseCommand):
    """Manage LearningResourceTopic data"""

    help = "Manage LearningResourceTopic data"

    def add_arguments(self, parser):
        """Add arguments supported by the command."""

        parser.add_argument(
            "mode",
            help="Mode to run in (create, update, delete)",
            choices=("create", "update", "delete"),
        )

        parser.add_argument("name", help="Topic name", nargs=1)

        parser.add_argument(
            "--parent",
            help="Parent topic for this topic. Specify topic ID or name.",
            nargs="?",
            default=None,
        )

        parser.add_argument(
            "--new-name",
            help="The new name for the topic (for update only)",
            nargs="?",
            default=None,
        )

    def handle(self, *args, **options):  # noqa: ARG002
        """Manage LearningResourceTopic data."""

        parent = None
        topic_name = options["name"].pop()

        if options["mode"] in ("update", "delete"):
            topic = LearningResourceTopic.objects.filter(name=topic_name).get()
        else:
            topic = LearningResourceTopic(name=topic_name)

        if options["mode"] == "delete":
            msg = f"Learning Resource Topic {topic.name} deleted"
            count, _ = topic.delete()

            if count > 1:
                msg = f"{msg} along with {count - 1} subtopics"

            self.stdout.write(self.style.SUCCESS(msg))
            return

        if options["mode"] == "update" and options["new_name"] is not None:
            topic.name = options["new_name"]

        if options["parent"] is not None:
            if options["parent"].isnumeric():
                parent = LearningResourceTopic.objects.get(pk=options["parent"])
            else:
                parent = LearningResourceTopic.objects.filter(
                    name=options["parent"]
                ).get()

        topic.save()
        parent.subtopics.add(parent) if parent else None

        msg = (
            f"{'Created' if options['mode'] == 'create' else 'Modified'} "
            f"topic {topic.name}"
        )

        self.stdout.write(self.style.SUCCESS(msg))
