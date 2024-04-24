"""Plugins for field channels"""

from django.apps import apps
from django.utils.text import slugify

from channels.constants import ChannelType
from channels.models import (
    ChannelDepartmentDetail,
    ChannelOfferorDetail,
    ChannelTopicDetail,
    FieldChannel,
)


class ChannelPlugin:
    """Create/delete channels based on learning_resources models"""

    hookimpl = apps.get_app_config("learning_resources").hookimpl

    @hookimpl
    def topic_upserted(self, topic, overwrite):
        """
        Create a channel for the topic if it doesn't already exist

        Args:
            topic(LearningResourceTopic): The topic that was upserted
            overwrite(bool): Whether to overwrite the existing channel

        Returns:
            tuple(FieldChannel, bool): Channel and "upserted" boolean
        """
        topic_detail = ChannelTopicDetail.objects.filter(topic=topic).first()
        if overwrite or not topic_detail:
            channel, _ = FieldChannel.objects.update_or_create(
                name=slugify(topic.name),
                channel_type=ChannelType.topic.name,
                defaults={"title": topic.name, "search_filter": f"topic={topic.name}"},
            )
            ChannelTopicDetail.objects.update_or_create(channel=channel, topic=topic)
            return channel, True
        return topic_detail.channel, False

    @hookimpl
    def topic_delete(self, topic):
        """
        Delete the topic and any existing channel for that topic

        Args:
            offeror(LearningResourceOfferor): The offeror to delete

        """
        FieldChannel.objects.filter(topic_detail__topic=topic).delete()
        topic.delete()

    @hookimpl
    def department_upserted(self, department, overwrite):
        """
        Create a channel for the department if it doesn't already exist

        Args:
            department(LearningResourceDepartment): The department that was upserted
            overwrite(bool): Whether to overwrite the existing channel


        Returns:
            tuple(FieldChannel, bool): Channel and "upserted" boolean
        """
        channel = FieldChannel.objects.filter(
            department_detail__department=department
        ).first()
        if channel and not department.school:
            channel.delete()
            channel = None
        elif department.school and (overwrite or not channel):
            channel, _ = FieldChannel.objects.update_or_create(
                name=slugify(department.name),
                channel_type=ChannelType.department.name,
                defaults={
                    "title": department.name,
                    "search_filter": f"department={department.department_id}",
                },
            )
            ChannelDepartmentDetail.objects.update_or_create(
                channel=channel, department=department
            )
            return channel, True
        return channel, False

    @hookimpl
    def department_delete(self, department):
        """
        Delete the department and any existing channel for that department

        Args:
            department(LearningResourceDepartment): The department to delete

        """
        FieldChannel.objects.filter(department_detail__department=department).delete()
        department.delete()

    @hookimpl
    def offeror_upserted(self, offeror, overwrite):
        """
        Create a channel for the offeror if it doesn't already exist

        Args:
            offeror(LearningResourceOfferor): The offeror that was upserted
            overwrite(bool): Whether to overwrite the existing channel

        Returns:
            tuple(FieldChannel, bool): Channel and "upserted" boolean
        """
        offeror_detail = ChannelOfferorDetail.objects.filter(offeror=offeror).first()
        if overwrite or not offeror_detail:
            channel, _ = FieldChannel.objects.update_or_create(
                name=offeror.code,
                channel_type=ChannelType.offeror.name,
                defaults={
                    "title": offeror.name,
                    "search_filter": f"offered_by={offeror.code}",
                },
            )
            ChannelOfferorDetail.objects.update_or_create(
                channel=channel, offeror=offeror
            )
            return channel, True
        return offeror_detail.channel, False

    @hookimpl
    def offeror_delete(self, offeror):
        """
        Delete the offeror and any existing channel for that offeror

        Args:
            offeror(LearningResourceOfferor): The offeror to delete

        """
        FieldChannel.objects.filter(offeror_detail__offeror=offeror).delete()
        offeror.delete()
