"""Tests for channels.permissions"""

import pytest
from django.contrib.auth.models import AnonymousUser

from channels import permissions
from channels.api import add_user_role
from channels.constants import CHANNEL_ROLE_MODERATORS
from main.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_can_view_channels(mocker):
    """Anyone should be able to view a list of field channels"""
    assert (
        permissions.HasChannelPermission().has_permission(
            mocker.Mock(user=AnonymousUser(), method="GET"), mocker.Mock()
        )
        is True
    )


@pytest.mark.parametrize("is_staff", [True, False])
def test_can_create_channels(mocker, is_staff):
    """Only staff should be able to create field channels"""
    field_user = UserFactory.create(is_staff=is_staff)
    assert (
        permissions.HasChannelPermission().has_permission(
            mocker.Mock(user=field_user, method="POST"), mocker.Mock()
        )
        is is_staff
    )


def test_can_view_channel_details(mocker, channel):
    """Anyone should be able to view details of a field channel"""
    assert (
        permissions.HasChannelPermission().has_object_permission(
            mocker.Mock(user=AnonymousUser(), method="GET"),
            mocker.Mock(),
            channel,
        )
        is True
    )


@pytest.mark.parametrize("is_moderator", [True, False])
def test_can_edit_channel_details(mocker, channel, is_moderator):
    """Only moderators should be able to edit details of a field channel"""
    field_user = UserFactory.create()
    if is_moderator:
        add_user_role(channel, CHANNEL_ROLE_MODERATORS, field_user)
    assert (
        permissions.HasChannelPermission().has_object_permission(
            mocker.Mock(user=field_user, method="PATCH"),
            mocker.Mock(kwargs={"id": channel.id}),
            channel,
        )
        is is_moderator
    )


@pytest.mark.parametrize("is_staff", [True, False])
def test_can_delete_channel(mocker, channel, is_staff):
    """Only staff should be able to delete a field channel"""
    field_user = UserFactory.create(is_staff=is_staff)
    assert (
        permissions.HasChannelPermission().has_object_permission(
            mocker.Mock(user=field_user, method="DELETE"),
            mocker.Mock(kwargs={"id": channel.id}),
            channel,
        )
        is is_staff
    )


@pytest.mark.parametrize("is_staff", [True, False])
@pytest.mark.parametrize("is_moderator", [True, False])
@pytest.mark.parametrize("method", ["GET", "POST"])
def test_can_view_create_moderators(  # pylint:disable=too-many-arguments
    mocker, channel, method, is_moderator, is_staff
):
    """Only moderators or staff should be able to view/create/delete moderators"""
    user = UserFactory.create(is_staff=is_staff)
    if is_moderator:
        add_user_role(channel, CHANNEL_ROLE_MODERATORS, user)
        user.refresh_from_db()
    assert permissions.ChannelModeratorPermissions().has_permission(
        mocker.Mock(user=user, method=method),
        mocker.Mock(kwargs={"id": channel.id}),
    ) is (is_moderator or is_staff)
    assert permissions.ChannelModeratorPermissions().has_object_permission(
        mocker.Mock(user=user, method=method),
        mocker.Mock(kwargs={"id": channel.id}),
        channel,
    ) is (is_moderator or is_staff)
