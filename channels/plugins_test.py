"""Tests for channels plugins"""

import pytest

from channels.constants import ChannelType
from channels.factories import (
    ChannelDepartmentDetailFactory,
    ChannelFactory,
    ChannelTopicDetailFactory,
)
from channels.models import Channel
from channels.plugins import ChannelPlugin
from learning_resources.factories import (
    LearningResourceDepartmentFactory,
    LearningResourceFactory,
    LearningResourceOfferorFactory,
    LearningResourceSchoolFactory,
    LearningResourceTopicFactory,
)
from learning_resources.models import (
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourceTopic,
)


@pytest.mark.django_db
@pytest.mark.parametrize("overwrite", [True, False])
def test_search_index_plugin_topic_upserted(overwrite):
    """The plugin function should create a topic channel"""
    topic = LearningResourceTopicFactory.create(name="Test & Testing Topic")
    channel, created = ChannelPlugin().topic_upserted(topic, overwrite)
    assert created is True
    assert channel.topic_detail.topic == topic
    assert channel.title == topic.name
    assert channel.channel_type == ChannelType.topic.name
    assert channel.search_filter == "topic=Test+%26+Testing+Topic"
    same_channel, upserted = ChannelPlugin().topic_upserted(topic, overwrite)
    assert channel == same_channel
    assert upserted is overwrite


@pytest.mark.django_db
def test_search_index_plugin_topic_delete():
    """The plugin function should delete a topic and associated channel"""
    channel = ChannelFactory.create(is_topic=True)
    topic = channel.topic_detail.topic
    assert topic is not None
    ChannelPlugin().topic_delete(topic)
    assert Channel.objects.filter(id=channel.id).exists() is False
    assert LearningResourceTopic.objects.filter(id=topic.id).exists() is False


@pytest.mark.django_db
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


@pytest.mark.django_db
def test_search_index_plugin_department_channel_deleted():
    """The plugin function should delete an existing department channel without a school"""
    department = LearningResourceDepartmentFactory.create(school=None)
    ChannelDepartmentDetailFactory.create(department=department)
    assert Channel.objects.filter(department_detail__department=department).exists()
    channel, upserted = ChannelPlugin().department_upserted(department, overwrite=False)
    assert channel is None
    assert upserted is False
    assert not Channel.objects.filter(department_detail__department=department).exists()


@pytest.mark.django_db
def test_search_index_plugin_department_delete():
    """The plugin function should delete a department and associated channel"""
    channel = ChannelFactory.create(is_department=True)
    department = channel.department_detail.department
    assert department is not None
    ChannelPlugin().department_delete(department)
    assert Channel.objects.filter(id=channel.id).exists() is False
    assert (
        LearningResourceDepartment.objects.filter(
            department_id=department.department_id
        ).exists()
        is False
    )


@pytest.mark.django_db
@pytest.mark.parametrize("overwrite", [True, False])
def test_search_index_plugin_department_rename(overwrite):
    """The plugin function should update the channel title when the department name changes"""
    channel = ChannelFactory.create(is_department=True)
    department = channel.department_detail.department
    old_title = channel.title
    assert department is not None
    new_name = "New Name"
    department.name = new_name
    department.save()
    updated_channel, updated = ChannelPlugin().department_upserted(
        department, overwrite
    )
    if updated:
        assert updated_channel.title == new_name
    else:
        assert updated_channel.title == old_title
    assert updated is overwrite


@pytest.mark.django_db
@pytest.mark.parametrize("overwrite", [True, False])
def test_search_index_plugin_offeror_upserted(overwrite):
    """The plugin function should create an offeror channel"""
    offeror = LearningResourceOfferorFactory.create()
    channel, created = ChannelPlugin().offeror_upserted(offeror, overwrite)
    assert channel.unit_detail.unit == offeror
    assert channel.title == offeror.name
    assert channel.channel_type == ChannelType.unit.name
    assert channel.search_filter == f"offered_by={offeror.code}"
    same_channel, upserted = ChannelPlugin().offeror_upserted(offeror, overwrite)
    assert channel == same_channel
    assert upserted is overwrite


@pytest.mark.django_db
def test_search_index_plugin_offeror_delete():
    """The plugin function should delete an offeror and associated channel"""
    channel = ChannelFactory.create(is_unit=True)
    offeror = channel.unit_detail.unit
    assert offeror is not None
    ChannelPlugin().offeror_delete(offeror)
    assert Channel.objects.filter(id=channel.id).exists() is False
    assert LearningResourceOfferor.objects.filter(code=offeror.code).exists() is False


@pytest.mark.parametrize("action", ["delete", "unpublish"])
@pytest.mark.parametrize(
    ("published_resources", "to_remove", "expect_channel_published"),
    [
        (2, 0, True),  # 2 published resources remain
        (2, 1, True),  # 1 published resources remain
        (2, 2, False),  # 0 published resource remains
    ],
)
@pytest.mark.django_db
def test_resource_before_delete_and_resource_unpublish(
    action, published_resources, to_remove, expect_channel_published
):
    """
    Test that topic channels are unpublished when they no longer have any resources
    remaining.
    """
    topic1 = LearningResourceTopicFactory.create()  # for to-be-deleted resources
    topic2 = LearningResourceTopicFactory.create()  # for to-be-deleted & others
    topic3 = LearningResourceTopicFactory.create()  # for to-be-deleted resources
    detail1 = ChannelTopicDetailFactory.create(topic=topic1)
    detail2 = ChannelTopicDetailFactory.create(topic=topic2)
    detail3 = ChannelTopicDetailFactory.create(topic=topic3)
    channel1, channel2, channel3 = detail1.channel, detail2.channel, detail3.channel

    resources_in_play = LearningResourceFactory.create_batch(
        published_resources,
        topics=[topic1, topic2, topic3],
    )

    # Create extra published + unpublished resources to ensure topic2 sticks around
    LearningResourceFactory.create(topics=[topic2])  # extra resources

    assert channel1.published
    assert channel2.published
    assert channel3.published

    for resource in resources_in_play[:to_remove]:
        if action == "delete":
            ChannelPlugin().resource_before_delete(resource)
            resource.delete()
        elif action == "unpublish":
            resource.published = False
            resource.save()
            ChannelPlugin().resource_unpublished(resource)
        else:
            msg = ValueError(f"Invalid action {action}")
            raise msg

    channel1.refresh_from_db()
    channel2.refresh_from_db()
    channel3.refresh_from_db()
    assert channel1.published is expect_channel_published
    assert channel2.published is True
    assert channel3.published is expect_channel_published


@pytest.mark.django_db
def test_resource_upserted():
    """
    Test that channels are published when a resource is created or updated
    """
    channel1 = ChannelFactory.create(is_topic=True, published=False)
    channel2 = ChannelFactory.create(is_topic=True, published=False)
    channel3 = ChannelFactory.create(is_topic=True, published=False)

    resource = LearningResourceFactory.create(
        topics=[channel1.topic_detail.topic, channel2.topic_detail.topic]
    )
    ChannelPlugin().resource_upserted(resource, None)

    channel1.refresh_from_db()
    channel2.refresh_from_db()
    channel3.refresh_from_db()

    assert channel1.published is True
    assert channel2.published is True
    assert channel3.published is False
