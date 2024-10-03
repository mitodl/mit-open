"""Pluggy plugins for learning resources"""

from django.apps import apps

from learning_resources.constants import FAVORITES_TITLE
from learning_resources.models import UserList


class FavoritesListPlugin:
    hookimpl = apps.get_app_config("authentication").hookimpl

    @hookimpl
    def user_created(self, user, user_data):  # noqa: ARG002
        """
        Perform functions on a newly created user

        Args:
            user(User): The user to create the list for
            user_data(dict): the user data
        """
        UserList.objects.get_or_create(
            author=user, title=FAVORITES_TITLE, defaults={"description": "My Favorites"}
        )
