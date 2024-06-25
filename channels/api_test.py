"""Tests for channels.api"""

import pytest

from channels.api import add_user_role, remove_user_role
from channels.constants import FIELD_ROLE_MODERATORS
from channels.models import ChannelGroupRole
from main.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_add_moderator(field_channel):
    """Test add moderator"""
    field_user = UserFactory.create()
    add_user_role(field_channel, FIELD_ROLE_MODERATORS, field_user)
    assert (
        ChannelGroupRole.objects.get(
            field__name=field_channel.name, role=FIELD_ROLE_MODERATORS
        ).group
        in field_user.groups.all()
    )


def test_remove_moderator(field_channel):
    """Test remove moderator"""
    field_user = UserFactory.create()
    add_user_role(field_channel, FIELD_ROLE_MODERATORS, field_user)
    remove_user_role(field_channel, FIELD_ROLE_MODERATORS, field_user)
    assert (
        ChannelGroupRole.objects.get(
            field__name=field_channel.name, role=FIELD_ROLE_MODERATORS
        ).group
        not in field_user.groups.all()
    )
