"""Tests for channels.api"""

import pytest

from channels.api import add_user_role, remove_user_role
from channels.constants import CHANNEL_ROLE_MODERATORS
from channels.models import ChannelGroupRole
from main.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_add_moderator(channel):
    """Test add moderator"""
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    assert (
        ChannelGroupRole.objects.get(
            channel__name=channel.name, role=CHANNEL_ROLE_MODERATORS
        ).group
        in channel_user.groups.all()
    )


def test_remove_moderator(channel):
    """Test remove moderator"""
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    remove_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    assert (
        ChannelGroupRole.objects.get(
            channel__name=channel.name, role=CHANNEL_ROLE_MODERATORS
        ).group
        not in channel_user.groups.all()
    )
