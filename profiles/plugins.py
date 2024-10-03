"""Pluggy plugins for profiles"""

from django.apps import apps

from profiles.models import Profile


class CreateProfilePlugin:
    hookimpl = apps.get_app_config("authentication").hookimpl

    @hookimpl
    def user_created(self, user, user_data=None):
        """
        Perform functions on a newly created user

        Args:
            user(User): the user that was created
            user_data(dict): the user data
        """
        profile_data = (user_data or {}).get("profile", {})
        Profile.objects.get_or_create(
            user=user,
            defaults={
                "name": profile_data["name"],
            },
        )
