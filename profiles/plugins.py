"""Pluggy plugins for profiles"""

from django.apps import apps

from main.utils import filter_dict_keys
from profiles.api import ensure_profile


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
        ensure_profile(
            user, filter_dict_keys(profile_data, ["name", "email_optin"], optional=True)
        )
