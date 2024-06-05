"""Pluggy plugins for profiles"""

from django.apps import apps

from profiles.models import Profile


class CreateProfilePlugin:
    hookimpl = apps.get_app_config("authentication").hookimpl

    @hookimpl
    def user_created(self, user):
        """
        Perform functions on a newly created user

        Args:
            user(User): The user to create the list for
        """
        Profile.objects.get_or_create(user=user)
