"""Management command to update learning resource content"""

from django.core.management.base import BaseCommand, CommandError

from learning_resources_search.tasks import update_featured_rank
from main.utils import now_in_utc


class Command(BaseCommand):
    """Indexes opensearch content"""

    def handle(self, *args, **kwargs):  # noqa: ARG002
        task = update_featured_rank.delay()
        self.stdout.write(f"Started celery task {task} to update featured ranks")

        self.stdout.write("Waiting on task...")
        start = now_in_utc()
        errors = task.get()
        if errors:
            msg = f"Update featured ranks errored: {errors}"
            raise CommandError(msg)

        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Update featured ranks finished, took {total_seconds} seconds"
        )
