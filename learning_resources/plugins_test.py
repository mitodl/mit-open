"""Tests for learning_resources plugins"""

import pytest

from learning_resources.constants import FAVORITES_TITLE
from learning_resources.factories import UserListFactory
from learning_resources.plugins import FavoritesListPlugin
from main.factories import UserFactory


@pytest.mark.django_db
@pytest.mark.parametrize("existing_list", [True, False])
def test_favorites_plugin_user_created(existing_list):
    """A UserList with title favorites should be created if it doesn't exist"""
    user = UserFactory.create()
    if existing_list:
        UserListFactory.create(
            author=user, title=FAVORITES_TITLE, description="My Favorites"
        )
    FavoritesListPlugin().user_created(user)
    user.refresh_from_db()
    assert user.user_lists.count() == 1
