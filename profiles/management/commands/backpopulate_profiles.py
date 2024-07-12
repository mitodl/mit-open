"""Management command for backpopulating user profiles"""  # noqa: INP001

from django.contrib.auth import get_user_model
from django.core.management import BaseCommand

from profiles import api

User = get_user_model()


class Command(BaseCommand):
    """Backpopulate user profiles"""

    help = __doc__

    def handle(self, *args, **options):  # noqa: ARG002
        """Run profile backpopulate"""

        users_missing_profiles = User.objects.filter(profile__isnull=True)

        self.stdout.write(f"Backpopulating {users_missing_profiles.count()} profiles")

        for user in users_missing_profiles:
            api.ensure_profile(user)
