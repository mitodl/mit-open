"""Pluggy plugins for profiles"""

from django.apps import apps

from profiles.api import ensure_profile


class CreateProfilePlugin:
    hookimpl = apps.get_app_config("authentication").hookimpl

    @hookimpl
    def user_created(self, user, user_data):
        """
        Perform functions on a newly created user

        Args:
            user(User): the user that was created
            user_data(dict): the user data
        """
        profile_data = user_data.get("profile", {})
        ensure_profile(user, profile_data)
