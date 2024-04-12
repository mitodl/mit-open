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
    def topic_upserted(self, topic):
        """
        Create a channel for the topic if it doesn't already exist

        Args:
            topic(LearningResourceTopic): The topic that was upserted

        Returns:
            tuple(FieldChannel, bool): Channel and "created" boolean
        """
        topic_detail = ChannelTopicDetail.objects.filter(topic=topic).first()
        if not topic_detail:
            channel, _ = FieldChannel.objects.get_or_create(
                name=slugify(topic.name),
                channel_type=ChannelType.topic.name,
                defaults={"title": topic.name, "search_filter": f"topic={topic.name}"},
            )
            ChannelTopicDetail.objects.create(channel=channel, topic=topic)
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
    def department_upserted(self, department):
        """
        Create a channel for the department if it doesn't already exist

        Args:
            department(LearningResourceDepartment): The department that was upserted
        """
        dept_detail = ChannelDepartmentDetail.objects.filter(
            department=department
        ).first()
        if not dept_detail:
            channel, _ = FieldChannel.objects.get_or_create(
                name=slugify(department.name),
                channel_type=ChannelType.department.name,
                defaults={
                    "title": department.name,
                    "search_filter": f"department={department.department_id}",
                },
            )
            ChannelDepartmentDetail.objects.create(
                channel=channel, department=department
            )
            return channel, True
        return dept_detail.channel, False

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
    def offeror_upserted(self, offeror):
        """
        Create a channel for the offeror if it doesn't already exist

        Args:
            offeror(LearningResourceOfferor): The offeror that was upserted
        """
        offeror_detail = ChannelOfferorDetail.objects.filter(offeror=offeror).first()
        if not offeror_detail:
            channel, _ = FieldChannel.objects.get_or_create(
                name=offeror.code,
                channel_type=ChannelType.offeror.name,
                defaults={
                    "title": offeror.name,
                    "search_filter": f"offeror={offeror.code}",
                },
            )
            ChannelOfferorDetail.objects.create(channel=channel, offeror=offeror)
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