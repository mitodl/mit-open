"""API for channels"""

from django.contrib.auth.models import Group, User
from django.db import transaction

from channels.constants import CHANNEL_ROLE_CHOICES, CHANNEL_ROLE_MODERATORS
from channels.models import Channel, ChannelGroupRole


def create_channel_groups_and_roles(
    channel: Channel,
) -> dict[str, ChannelGroupRole]:
    """
    Create a channel's groups and roles
    """
    roles = {}
    for role in CHANNEL_ROLE_CHOICES:
        group, _ = Group.objects.get_or_create(name=f"channel_{channel.name}_{role}")
        roles[role], _ = ChannelGroupRole.objects.get_or_create(
            channel=channel, group=group, role=role
        )

    return roles


@transaction.atomic
def get_role_model(channel: Channel, role: str) -> ChannelGroupRole:
    """
    Get or create a ChannelGroupRole object
    """
    return ChannelGroupRole.objects.get(channel=channel, role=role)


def add_user_role(channel: Channel, role: str, user: User):
    """
    Add a user to a channel role's group
    """
    get_role_model(channel, role).group.user_set.add(user)


def remove_user_role(channel: Channel, role: str, user: User):
    """
    Remove a user from a channel role's group
    """
    get_role_model(channel, role).group.user_set.remove(user)


def get_group_role_name(channel_id: int, role: str) -> str:
    """Get the group name for a Channel and role"""
    channel_name = Channel.objects.get(id=channel_id).name
    return f"channel_{channel_name}_{role}"


def is_moderator(user: User, channel_id: int) -> bool:
    """
    Determine if the user is a moderator for a channel (or a staff user)
    """
    if not user or not channel_id:
        return False
    group_names = set(user.groups.values_list("name", flat=True))
    return (
        user.is_staff
        or get_group_role_name(channel_id, CHANNEL_ROLE_MODERATORS) in group_names
    )
