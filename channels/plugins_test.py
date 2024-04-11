"""Tests for channels plugins"""

import pytest

from channels.constants import ChannelType
from channels.plugins import ChannelPlugin
from learning_resources.factories import (
    LearningResourceDepartmentFactory,
    LearningResourceOfferorFactory,
    LearningResourceTopicFactory,
)


@pytest.mark.django_db()
def test_search_index_plugin_topic_upserted():
    """The plugin function should create a topic channel"""
    topic = LearningResourceTopicFactory.create()
    channel, created = ChannelPlugin().topic_upserted(topic)
    assert created is True
    assert channel.topic_detail.topic == topic
    assert channel.title == topic.name
    assert channel.channel_type == ChannelType.topic.name
    same_channel, created = ChannelPlugin().topic_upserted(topic)
    assert channel == same_channel
    assert created is False


@pytest.mark.django_db()
def test_search_index_plugin_department_upserted():
    """The plugin function should create a department channel"""
    department = LearningResourceDepartmentFactory.create()
    channel, created = ChannelPlugin().department_upserted(department)
    assert channel.department_detail.department == department
    assert channel.title == department.name
    assert channel.channel_type == ChannelType.department.name
    same_channel, created = ChannelPlugin().department_upserted(department)
    assert channel == same_channel
    assert created is False


@pytest.mark.django_db()
def test_search_index_plugin_offeror_upserted():
    """The plugin function should create an offeror channel"""
    offeror = LearningResourceOfferorFactory.create()
    channel, created = ChannelPlugin().offeror_upserted(offeror)
    assert channel.offeror_detail.offeror == offeror
    assert channel.title == offeror.name
    assert channel.channel_type == ChannelType.offeror.name
    same_channel, created = ChannelPlugin().offeror_upserted(offeror)
    assert channel == same_channel
    assert created is False
