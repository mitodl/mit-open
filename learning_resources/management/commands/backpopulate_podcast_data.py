"""Management command for populating see course data"""
from django.core.management import BaseCommand

from learning_resources.models import Podcast, PodcastEpisode
from learning_resources.tasks import get_podcast_data
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Populate podcasts"""

    help = "Populate podcasts"  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing records first",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Run Populate Podcast data"""
        if options["delete"]:
            self.stdout.write("Deleting all existing Podcasts courses from database")
            for podcast_episode in PodcastEpisode.objects.all():
                podcast_episode.learning_resource.delete()
                # NOTE: Deindex here when implemented
            for podcast in Podcast.objects.all():
                podcast.learning_resource.delete()
                # NOTE: Deindex here when implemented
        else:
            task = get_podcast_data.delay()
            self.stdout.write(f"Started task {task} to get podcast data")
            self.stdout.write("Waiting on task...")
            start = now_in_utc()
            task.get()
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                f"Population of podcast data finished, took {total_seconds} seconds"
            )
