"""Signals for channels"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from guardian.shortcuts import assign_perm

from channels.api import create_field_groups_and_roles
from channels.constants import FIELD_ROLE_MODERATORS
from channels.models import FieldChannel
from widgets.models import WidgetList

WIDGET_LIST_CHANGE_PERM = "widgets.change_widgetlist"


@receiver(
    post_save,
    sender=FieldChannel,
    dispatch_uid="channelmembershipconfig_post_save",
)
def handle_create_field_channel(
    sender,  # noqa: ARG001
    instance,
    created,
    **kwargs,  # noqa: ARG001
):  # pylint: disable=unused-argument
    """
    Create a WidgetList and permissions group for each new FieldChannel.
    """
    if created:
        widget = WidgetList.objects.create()
        widget.field_channel.set([instance])
        roles = create_field_groups_and_roles(instance)
        moderator_group = roles[FIELD_ROLE_MODERATORS].group
        assign_perm(WIDGET_LIST_CHANGE_PERM, moderator_group, instance.widget_list)
