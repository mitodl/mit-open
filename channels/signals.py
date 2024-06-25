"""Signals for channels"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from guardian.shortcuts import assign_perm

from channels.api import create_channel_groups_and_roles
from channels.constants import CHANNEL_ROLE_MODERATORS
from channels.models import Channel
from widgets.models import WidgetList

WIDGET_LIST_CHANGE_PERM = "widgets.change_widgetlist"


@receiver(
    post_save,
    sender=Channel,
    dispatch_uid="channelmembershipconfig_post_save",
)
def handle_create_channel(
    sender,  # noqa: ARG001
    instance,
    created,
    **kwargs,  # noqa: ARG001
):  # pylint: disable=unused-argument
    """
    Create a WidgetList and permissions group for each new Channel.
    """
    if created:
        widget = WidgetList.objects.create()
        widget.channel.set([instance])
        roles = create_channel_groups_and_roles(instance)
        moderator_group = roles[CHANNEL_ROLE_MODERATORS].group
        assign_perm(WIDGET_LIST_CHANGE_PERM, moderator_group, instance.widget_list)
