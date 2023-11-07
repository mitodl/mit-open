"""Management command for retiring users"""  # noqa: INP001

from django.contrib.auth import get_user_model
from django.core.management import BaseCommand

from search import search_index_helpers

User = get_user_model()


class Command(BaseCommand):
    """Retire a user"""

    help = "Retire a user"  # noqa: A003

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument("--user-id", help="the id of the user")
        group.add_argument("--email", help="the email of the user")
        group.add_argument("--username", help="the username of the user")

    def handle(self, *args, **options):  # noqa: ARG002
        """Run retire a user"""
        if options["user_id"]:
            user = User.objects.get(id=options["user_id"])
        elif options["username"]:
            user = User.objects.get(username=options["username"])
        elif options["email"]:
            user = User.objects.get(email=options["email"])

        self.stdout.write(
            "Setting user inactive, clearing email, and setting unusable password"
        )
        user.email = ""
        user.is_active = False
        user.set_unusable_password()
        user.save()

        self.stdout.write(f"Deleting {user.social_auth.count()} social auths")
        user.social_auth.all().delete()

        search_index_helpers.deindex_profile(user)

        self.stdout.write(f"Retired user: {user}")
