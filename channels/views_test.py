"""Tests for channels.views"""

import os

import pytest
from django.contrib.auth.models import Group, User
from django.urls import reverse

from channels.api import add_user_role
from channels.constants import CHANNEL_ROLE_MODERATORS, ChannelType
from channels.factories import (
    ChannelFactory,
    ChannelListFactory,
    SubChannelFactory,
)
from channels.models import Channel, ChannelTopicDetail
from channels.serializers import ChannelSerializer
from learning_resources.constants import LearningResourceType
from learning_resources.factories import (
    LearningResourceFactory,
    LearningResourceTopicFactory,
)
from main.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_list_channels(user_client):
    """Test that all channels are returned"""
    channels = sorted(ChannelFactory.create_batch(15), key=lambda f: f.id)
    url = reverse("channels:v0:channels_api-list")
    channel_list = sorted(user_client.get(url).json()["results"], key=lambda f: f["id"])
    assert len(channel_list) == len(channels)
    for idx, channel in enumerate(channels):
        assert channel_list[idx] == ChannelSerializer(instance=channel).data


@pytest.mark.parametrize("is_moderator", [True, False])
def test_channel_is_moderator(channel, client, is_moderator):
    """Test that the channel details are correct"""
    channel_user = UserFactory.create()
    if is_moderator:
        add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    client.force_login(channel_user)
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    assert client.get(url).json()["is_moderator"] == is_moderator


def test_create_channel(admin_client):
    """An admin should be able to create a new channel"""
    url = reverse("channels:v0:channels_api-list")
    topic = LearningResourceTopicFactory.create()
    data = {
        "name": "biology",
        "title": "Biology",
        "about": {},
        "channel_type": ChannelType.topic.name,
        "topic_detail": {"topic": topic.id},
    }
    admin_client.post(url, data=data).json()
    assert Channel.objects.filter(name=data["name"]).exists()
    assert ChannelTopicDetail.objects.filter(channel__name=data["name"]).exists()


def test_create_channel_missing_name(admin_client):
    """Name is required for creating a channel"""
    url = reverse("channels:v0:channels_api-list")
    data = {"title": "Biology", "about": {}}
    response = admin_client.post(url, data=data)
    assert response.status_code == 400
    assert response.json() == {
        "channel_type": ["This field is required."],
        "error_type": "ValidationError",
        "name": ["This field is required."],
    }


@pytest.mark.parametrize("resource_type", LearningResourceType)
def test_create_channel_featured_list_only_learning_path(admin_client, resource_type):
    """Only learning_paths may be used as featured_list"""
    url = reverse("channels:v0:channels_api-list")
    resource = LearningResourceFactory.create(resource_type=resource_type.name)
    status = 201 if resource_type == LearningResourceType.learning_path else 400
    data = {
        "title": "Biology",
        "name": "biology",
        "featured_list": resource.id,
        "channel_type": ChannelType.pathway.name,
    }
    response = admin_client.post(url, data=data, format="appliation/json")
    assert response.status_code == status


@pytest.mark.parametrize("resource_type", LearningResourceType)
def test_partial_update_channel_featured_list_only_learning_path(
    admin_client, resource_type
):
    """Only learning_paths may be used as featured_list"""
    channel = ChannelFactory.create()
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    resource = LearningResourceFactory.create(resource_type=resource_type.name)
    status = 200 if resource_type == LearningResourceType.learning_path else 400
    data = {"featured_list": resource.id}
    response = admin_client.patch(url, data=data, content_type="application/json")
    assert response.status_code == status


@pytest.mark.parametrize("resource_type", LearningResourceType)
def test_create_channel_lists_only_learning_path(admin_client, resource_type):
    """Only learning_paths may be used as one of lists"""
    url = reverse("channels:v0:channels_api-list")
    resource = LearningResourceFactory.create(resource_type=resource_type.name)
    resource2 = LearningResourceFactory.create(resource_type=resource_type.name)
    status = 201 if resource_type == LearningResourceType.learning_path else 400
    data = {
        "title": "Biology",
        "name": "biology",
        "lists": [resource.id, resource2.id],
        "channel_type": ChannelType.pathway.name,
    }
    response = admin_client.post(url, data=data, content_type="application/json")
    assert response.status_code == status


@pytest.mark.parametrize("resource_type", LearningResourceType)
def test_partial_update_channel_lists_only_learning_path(admin_client, resource_type):
    """Only learning_paths may be used as one of lists"""
    channel = ChannelFactory.create()
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    resource = LearningResourceFactory.create(resource_type=resource_type.name)
    status = 200 if resource_type == LearningResourceType.learning_path else 400
    data = {"lists": [resource.id]}
    response = admin_client.patch(url, data=data, content_type="application/json")
    assert response.status_code == status


def test_create_channel_forbidden(user_client):
    """A normal user should not be able to create a new channel"""
    url = reverse("channels:v0:channels_api-list")
    data = {"name": "biology", "title": "Biology", "about": {}}
    response = user_client.post(url, data=data)
    assert response.status_code == 403
    assert Channel.objects.filter(name=data["name"]).exists() is False


def test_update_channel(channel, client):
    """A moderator should be able to update a channel"""
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    data = {"title": "NEW TITLE", "about": {}}
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    client.force_login(channel_user)
    response = client.patch(url, data=data)
    assert response.status_code == 200
    channel.refresh_from_db()
    assert channel.title == data["title"]
    assert channel.about == data["about"]


@pytest.mark.parametrize("attribute", ["avatar", "banner"])
def test_patch_channel_image(client, channel, attribute):
    """
    Update a channel's image
    """
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    png_file = os.path.join(  # noqa: PTH118
        os.path.dirname(__file__),  # noqa: PTH120
        "..",
        "frontends",
        "mit-open",
        "public",
        "images",
        "blank.png",
    )
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    client.force_login(channel_user)
    with open(png_file, "rb") as f:  # noqa: PTH123
        resp = client.patch(url, {attribute: f}, format="multipart")
    assert resp.status_code == 200
    channel.refresh_from_db()
    image = getattr(channel, attribute)

    assert f"{channel.name}/channel_{attribute}_" in image.url
    assert len(image.read()) == os.path.getsize(png_file)  # noqa: PTH202

    if attribute == "avatar":
        for size_channel in ("avatar_small", "avatar_medium"):
            size_image = getattr(channel, size_channel)
            assert len(size_image.read()) > 0


def test_channel_by_type_name_detail(user_client):
    """ChannelByTypeNameDetailView should return expected result"""
    channel = ChannelFactory.create(is_topic=True)
    url = reverse(
        "channels:v0:channel_by_type_name_api-detail",
        kwargs={"channel_type": ChannelType.topic.name, "name": channel.name},
    )
    response = user_client.get(url)
    assert response.json() == ChannelSerializer(instance=channel).data
    Channel.objects.filter(id=channel.id).update(
        channel_type=ChannelType.department.name
    )
    response = user_client.get(url)
    assert response.status_code == 404


def test_update_channel_forbidden(channel, user_client):
    """A normal user should not be able to update a channel"""
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    response = user_client.patch(url, data={"title": "new"})
    assert response.status_code == 403


def test_update_channel_conflict(client):
    """An error should occur if there is a channel_type/name conflict"""
    channel_1 = ChannelFactory.create(is_topic=True, name="biology")
    channel_2 = ChannelFactory.create(is_department=True, name="biology")

    channel_user = UserFactory.create()
    add_user_role(channel_1, CHANNEL_ROLE_MODERATORS, channel_user)
    client.force_login(channel_user)

    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel_1.id},
    )
    data = {"channel_type": ChannelType.department.name}
    response = client.patch(url, data=data)
    assert response.status_code == 400
    assert (
        response.json()["non_field_errors"][0]
        == "The fields name, channel_type must make a unique set."
    )
    channel_2.delete()
    response = client.patch(url, data=data)
    assert response.status_code == 200


def test_delete_channel(channel, client):
    """An admin should be able to delete a channel"""
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    client.force_login(UserFactory.create(is_staff=True))
    response = client.delete(url)
    assert response.status_code == 204


def test_delete_channel_forbidden(channel, client):
    """A moderator should npt be able to delete a channel"""
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    client.force_login(channel_user)
    response = client.delete(url)
    assert response.status_code == 403


def test_list_moderators(channel, client):
    """A channel moderator should be able to view other moderators for the channel"""
    url = reverse(
        "channels:v0:channel_moderators_api-list",
        kwargs={"id": channel.id},
    )
    channel_user = UserFactory.create()
    other_mod = UserFactory.create()
    group = Group.objects.get(name=f"channel_{channel.name}_moderators")
    for user in [channel_user, other_mod]:
        add_user_role(channel, CHANNEL_ROLE_MODERATORS, user)
        assert user in group.user_set.all()
        assert user in User.objects.filter(
            groups__name=f"channel_{channel.name}_moderators"
        )
    client.force_login(channel_user)
    mods_list = sorted(client.get(url).json(), key=lambda user: user["moderator_name"])
    for idx, user in enumerate(
        sorted([channel_user, other_mod], key=lambda user: user.username)
    ):
        assert user.username == mods_list[idx]["moderator_name"]


def test_list_moderators_forbidden(channel, user_client):
    """A normal user should not be able to view other moderators for the channel"""
    url = reverse(
        "channels:v0:channel_moderators_api-list",
        kwargs={"id": channel.id},
    )
    assert user_client.get(url).status_code == 403


def test_add_moderator(channel, client):
    """A moderator should be able to add other moderators"""
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    url = reverse(
        "channels:v0:channel_moderators_api-list",
        kwargs={"id": channel.id},
    )
    client.force_login(channel_user)
    other_user_1 = UserFactory.create()
    other_user_2 = UserFactory.create()
    client.post(url, data={"email": other_user_1.email})
    client.post(url, data={"moderator_name": other_user_2.username})
    updated_mods = [user["email"] for user in client.get(url).json()]
    assert other_user_1.email in updated_mods
    assert other_user_2.email in updated_mods


def test_add_moderator_forbidden(channel, user_client):
    """A normal user should not be able to add other moderators"""
    url = reverse(
        "channels:v0:channel_moderators_api-list",
        kwargs={"id": channel.id},
    )
    assert (
        user_client.post(url, data={"email": UserFactory.create().email}).status_code
        == 403
    )


def test_delete_moderator(channel, client):
    """A channel moderator should be able to delete other moderators for the channel"""
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    other_mod = UserFactory.create()
    for user in [channel_user, other_mod]:
        add_user_role(channel, CHANNEL_ROLE_MODERATORS, user)
    url = reverse(
        "channels:v0:channel_moderators_api-detail",
        kwargs={"id": channel.id, "moderator_name": other_mod.username},
    )
    client.force_login(channel_user)
    assert client.delete(url).status_code == 204


def test_delete_moderator_forbidden(channel, user_client):
    """A normal user should not be able to delete other moderators for the channel"""
    channel_user = UserFactory.create()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    url = reverse(
        "channels:v0:channel_moderators_api-detail",
        kwargs={
            "id": channel.id,
            "moderator_name": channel_user.username,
        },
    )
    assert user_client.delete(url).status_code == 403


@pytest.mark.parametrize("related_count", [1, 5, 10])
def test_no_excess_queries(user_client, django_assert_num_queries, related_count):
    """
    There should be a constant number of queries made, independent of number of
    sub_channels / lists.
    """
    # This isn't too important; we care it does not scale with number of related items
    expected_query_count = 11

    topic_channel = ChannelFactory.create(is_topic=True)
    ChannelListFactory.create_batch(related_count, channel=topic_channel)
    SubChannelFactory.create_batch(related_count, parent_channel=topic_channel)

    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": topic_channel.id},
    )
    with django_assert_num_queries(expected_query_count):
        user_client.get(url)


def test_channel_configuration_is_not_editable(client, channel):
    """Test that the 'configuration' object is read-only"""
    url = reverse(
        "channels:v0:channels_api-detail",
        kwargs={"id": channel.id},
    )
    data = {"title": "NEW TITLE", "about": {}, "configuration": {"updated_config": 1}}
    channel_user = UserFactory.create()
    initial_config = {"test": "test"}
    channel.configuration = initial_config
    channel.save()
    add_user_role(channel, CHANNEL_ROLE_MODERATORS, channel_user)
    client.force_login(channel_user)
    response = client.patch(url, data=data)
    assert response.status_code == 200
    channel.refresh_from_db()
    assert channel.configuration == initial_config
