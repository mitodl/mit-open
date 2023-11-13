"""Management command to create user Favorites lists"""
from django.contrib.auth.models import User
from django.core.management import BaseCommand

from learning_resources.constants import FAVORITES_TITLE
from learning_resources.models import UserList
from open_discussions.utils import now_in_utc


class Command(BaseCommand):
    """Create a Favorites userlist for every active user"""

    help = "Create a Favorites userlist for every active user"  # noqa: A003

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            dest="delete",
            action="store_true",
            help="Delete all existing Favorites user lists",
        )
        super().add_arguments(parser)

    def handle(self, *args, **options):  # noqa: ARG002
        """Create a Favorites userlist for every active user"""
        if options["delete"]:
            self.stdout.write("Deleting all existing Favorites userlists")
            UserList.objects.filter(title=FAVORITES_TITLE).delete()
        else:
            self.stdout.write("Creating Favorites lists for each user")
            start = now_in_utc()
            user_ids = UserList.objects.filter(title=FAVORITES_TITLE).values_list(
                "author_id", flat=True
            )
            for user in User.objects.exclude(id__in=user_ids).exclude(is_active=False):
                UserList.objects.get_or_create(
                    author=user,
                    title=FAVORITES_TITLE,
                    defaults={"description": "My Favorites"},
                )
            total_seconds = (now_in_utc() - start).total_seconds()
            self.stdout.write(
                "Population of user favorites list finished, took {} seconds".format(
                    total_seconds
                )
            )
