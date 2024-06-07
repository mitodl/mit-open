"""Tests for channels plugins"""

import pytest

from channels.constants import ChannelType
from channels.factories import ChannelDepartmentDetailFactory, FieldChannelFactory
from channels.models import FieldChannel
from channels.plugins import ChannelPlugin
from learning_resources.factories import (
    LearningResourceDepartmentFactory,
    LearningResourceOfferorFactory,
    LearningResourceSchoolFactory,
    LearningResourceTopicFactory,
)
from learning_resources.models import (
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourceTopic,
)


@pytest.mark.django_db()
@pytest.mark.parametrize("overwrite", [True, False])
def test_search_index_plugin_topic_upserted(overwrite):
    """The plugin function should create a topic channel"""
    topic = LearningResourceTopicFactory.create()
    channel, created = ChannelPlugin().topic_upserted(topic, overwrite)
    assert created is True
    assert channel.topic_detail.topic == topic
    assert channel.title == topic.name
    assert channel.channel_type == ChannelType.topic.name
    assert channel.search_filter == f"topic={topic.name}"
    same_channel, upserted = ChannelPlugin().topic_upserted(topic, overwrite)
    assert channel == same_channel
    assert upserted is overwrite


@pytest.mark.django_db()
def test_search_index_plugin_topic_delete():
    """The plugin function should delete a topic and associated channel"""
    channel = FieldChannelFactory.create(is_topic=True)
    topic = channel.topic_detail.topic
    assert topic is not None
    ChannelPlugin().topic_delete(topic)
    assert FieldChannel.objects.filter(id=channel.id).exists() is False
    assert LearningResourceTopic.objects.filter(id=topic.id).exists() is False


@pytest.mark.django_db()
@pytest.mark.parametrize("overwrite", [True, False])
@pytest.mark.parametrize("has_school", [True, False])
def test_search_index_plugin_department_upserted(overwrite, has_school):
    """The plugin function should create a department channel if it has a school"""
    department = LearningResourceDepartmentFactory.create(
        school=LearningResourceSchoolFactory.create() if has_school else None
    )
    channel, created = ChannelPlugin().department_upserted(department, overwrite)
    assert (channel is not None) is has_school
    assert created is has_school
    if has_school:
        assert channel.department_detail.department == department
        assert channel.title == department.name
        assert channel.channel_type == ChannelType.department.name
        assert channel.search_filter == f"department={department.department_id}"
    same_channel, upserted = ChannelPlugin().department_upserted(department, overwrite)
    assert channel == same_channel
    assert upserted is (overwrite and has_school)


@pytest.mark.django_db()
def test_search_index_plugin_department_channel_deleted():
    """The plugin function should delete an existing department channel without a school"""
    department = LearningResourceDepartmentFactory.create(school=None)
    ChannelDepartmentDetailFactory.create(department=department)
    assert FieldChannel.objects.filter(
        department_detail__department=department
    ).exists()
    channel, upserted = ChannelPlugin().department_upserted(department, overwrite=False)
    assert channel is None
    assert upserted is False
    assert not FieldChannel.objects.filter(
        department_detail__department=department
    ).exists()


@pytest.mark.django_db()
def test_search_index_plugin_department_delete():
    """The plugin function should delete a department and associated channel"""
    channel = FieldChannelFactory.create(is_department=True)
    department = channel.department_detail.department
    assert department is not None
    ChannelPlugin().department_delete(department)
    assert FieldChannel.objects.filter(id=channel.id).exists() is False
    assert (
        LearningResourceDepartment.objects.filter(
            department_id=department.department_id
        ).exists()
        is False
    )


@pytest.mark.django_db()
@pytest.mark.parametrize("overwrite", [True, False])
def test_search_index_plugin_offeror_upserted(overwrite):
    """The plugin function should create an offeror channel"""
    offeror = LearningResourceOfferorFactory.create()
    channel, created = ChannelPlugin().offeror_upserted(offeror, overwrite)
    assert channel.offeror_detail.unit == offeror
    assert channel.title == offeror.name
    assert channel.channel_type == ChannelType.unit.name
    assert channel.search_filter == f"offered_by={offeror.code}"
    same_channel, upserted = ChannelPlugin().offeror_upserted(offeror, overwrite)
    assert channel == same_channel
    assert upserted is overwrite


@pytest.mark.django_db()
def test_search_index_plugin_offeror_delete():
    """The plugin function should delete an offeror and associated channel"""
    channel = FieldChannelFactory.create(is_offeror=True)
    offeror = channel.offeror_detail.unit
    assert offeror is not None
    ChannelPlugin().offeror_delete(offeror)
    assert FieldChannel.objects.filter(id=channel.id).exists() is False
    assert LearningResourceOfferor.objects.filter(code=offeror.code).exists() is False
