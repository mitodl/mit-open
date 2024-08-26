"""Tests for channels.serializers"""

from types import SimpleNamespace

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from channels.constants import CHANNEL_ROLE_MODERATORS, ChannelType
from channels.factories import (
    ChannelDepartmentDetailFactory,
    ChannelFactory,
    ChannelListFactory,
    ChannelPathwayDetailFactory,
    ChannelTopicDetailFactory,
    ChannelUnitDetailFactory,
    SubChannelFactory,
)
from channels.models import ChannelGroupRole
from channels.serializers import (
    ChannelCreateSerializer,
    ChannelDepartmentDetailSerializer,
    ChannelModeratorSerializer,
    ChannelPathwayDetailSerializer,
    ChannelSerializer,
    ChannelTopicDetailSerializer,
    ChannelUnitDetailSerializer,
    ChannelWriteSerializer,
    LearningPathPreviewSerializer,
)
from learning_resources.factories import (
    LearningPathFactory,
    LearningResourceDepartmentFactory,
    LearningResourceOfferorFactory,
    LearningResourceTopicFactory,
)
from learning_resources.serializers import LearningResourceOfferorDetailSerializer
from main.factories import UserFactory
from main.utils import frontend_absolute_url

# pylint:disable=redefined-outer-name
pytestmark = pytest.mark.django_db


small_gif = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04"
    b"\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02"
    b"\x02\x4c\x01\x00\x3b"
)


@pytest.fixture
def channel_detail():
    """Return possible related objects for a channel"""
    topic = LearningResourceTopicFactory.create()
    department = LearningResourceDepartmentFactory.create()
    offeror = LearningResourceOfferorFactory.create()
    return SimpleNamespace(
        topic=ChannelTopicDetailSerializer(
            instance=ChannelTopicDetailFactory.build(topic=topic)
        ).data,
        department=ChannelDepartmentDetailSerializer(
            instance=ChannelDepartmentDetailFactory.build(department=department)
        ).data,
        unit=ChannelUnitDetailSerializer(
            instance=ChannelUnitDetailFactory.build(unit=offeror)
        ).data,
        pathway=ChannelPathwayDetailSerializer(
            instance=ChannelPathwayDetailFactory.build()
        ).data,
    )


def mock_image_file(filename):
    """Return a File object with a given name"""
    return SimpleUploadedFile(filename, small_gif, content_type="image/gif")


@pytest.fixture
def base_channel_data():
    """Base channel data for serializers"""  # noqa: D401
    return {
        "name": "my_channel_name",
        "channel_type": ChannelType.pathway.name,
        "title": "my_title",
        "about": {"foo": "bar"},
        "public_description": "my desc",
    }


@pytest.mark.parametrize("has_avatar", [True, False])
@pytest.mark.parametrize("has_banner", [True, False])
@pytest.mark.parametrize("has_about", [True, False])
@pytest.mark.parametrize("ga_tracking_id", ["", "abc123"])
def test_serialize_channel(  # pylint: disable=too-many-arguments
    mocker, has_avatar, has_banner, has_about, ga_tracking_id
):
    """
    Test serializing a channel
    """

    mocker.patch("channels.models.ResizeToFit", autospec=True)
    channel = ChannelFactory.create(
        banner=mock_image_file("banner.jpg") if has_banner else None,
        avatar=mock_image_file("avatar.jpg") if has_avatar else None,
        about={"foo": "bar"} if has_about else None,
        ga_tracking_id=ga_tracking_id,
        channel_type=ChannelType.unit.name,
        search_filter="offered_by=ocw",
    )

    channel_lists = ChannelListFactory.create_batch(3, channel=channel)

    assert ChannelSerializer(channel).data == {
        "name": channel.name,
        "title": channel.title,
        "avatar": channel.avatar.url if has_avatar else None,
        "avatar_small": channel.avatar_small.url if has_avatar else None,
        "avatar_medium": channel.avatar_medium.url if has_avatar else None,
        "banner": channel.banner.url if has_banner else None,
        "ga_tracking_id": channel.ga_tracking_id,
        "widget_list": channel.widget_list.id,
        "about": channel.about,
        "updated_on": mocker.ANY,
        "created_on": mocker.ANY,
        "id": channel.id,
        "channel_url": frontend_absolute_url(
            f"/c/{channel.channel_type}/{channel.name}/"
        ),
        "lists": [
            LearningPathPreviewSerializer(channel_list.channel_list).data
            for channel_list in sorted(
                channel_lists,
                key=lambda l: l.position,  # noqa: E741
            )
        ],
        "sub_channels": [],
        "featured_list": None,
        "public_description": channel.public_description,
        "is_moderator": False,
        "configuration": {},
        "search_filter": channel.search_filter,
        "channel_type": ChannelType.unit.name,
        "unit_detail": {
            "unit": LearningResourceOfferorDetailSerializer(
                instance=channel.unit_detail.unit
            ).data,
        },
    }


@pytest.mark.parametrize("channel_type", ChannelType.names())
def test_create_channel(base_channel_data, channel_detail, channel_type):
    """
    Test creating a channel
    """
    paths = sorted(
        (p.learning_resource for p in LearningPathFactory.create_batch(2)),
        key=lambda list: list.id,  # noqa: A002
        reverse=True,
    )

    detail = {f"{channel_type}_detail": getattr(channel_detail, f"{channel_type}")}

    data = {
        **base_channel_data,
        **detail,
        "featured_list": paths[0].id,
        "lists": [path.id for path in paths],
        "channel_type": channel_type,
        "configuration": {
            "key": "value",
        },
    }
    serializer = ChannelCreateSerializer(data=data)
    assert serializer.is_valid()
    channel = serializer.create(serializer.validated_data)
    assert channel.widget_list is not None
    assert channel.name == data["name"]
    assert channel.title == data["title"]
    assert channel.about == data["about"]
    assert channel.public_description == data["public_description"]
    assert channel.featured_list == paths[0]
    assert channel.configuration != data["configuration"]
    assert [
        channel_list.channel_list.id
        for channel_list in channel.lists.all().order_by("position")
    ] == [path.id for path in paths]
    for name in ChannelType.names():
        assert (getattr(channel, f"{name}_detail", None) is not None) is (
            name == channel_type
        )


def test_create_and_write_response_serialization():
    """
    Test that the create and write serializers return the same data as the read serializer
    """
    channel = ChannelFactory.create()
    assert ChannelCreateSerializer().to_representation(
        channel
    ) == ChannelSerializer().to_representation(channel)
    assert ChannelWriteSerializer().to_representation(
        channel
    ) == ChannelSerializer().to_representation(channel)


def test_create_channel_private_list(base_channel_data):
    """Validation should fail if a list is private"""
    learning_path = LearningPathFactory.create(is_unpublished=True)
    data = {
        **base_channel_data,
        "featured_list": learning_path.id,
        "lists": [learning_path.id],
    }
    serializer = ChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "featured_list" in serializer.errors


def test_create_channel_bad_list_values(base_channel_data):
    """Validation should fail if lists channel has non-integer values"""
    data = {**base_channel_data, "lists": ["my_list"]}
    serializer = ChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "lists" in serializer.errors


def test_create_channel_with_sub_channels(base_channel_data):
    """Field channels can be created with sub_channels"""
    other_channels = sorted(
        ChannelFactory.create_batch(2), key=lambda channel: channel.id, reverse=True
    )
    data = {
        **base_channel_data,
        "sub_channels": [other_channel.name for other_channel in other_channels],
    }
    serializer = ChannelCreateSerializer(data=data)
    assert serializer.is_valid() is True
    channel = serializer.create(serializer.validated_data)
    for other_channel in other_channels:
        assert other_channel.name in channel.sub_channels.values_list(
            "channel__name", flat=True
        ).order_by("position")


def test_create_channel_not_existing_sub_channels(base_channel_data):
    """Validation should fail if a subchannel does not exist"""
    data = {**base_channel_data, "sub_channels": ["fake"]}
    serializer = ChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "sub_channels" in serializer.errors


def test_create_channel_self_reference_sub_channels(base_channel_data):
    """Validation should fail if channel is subchannel of itself"""
    data = {**base_channel_data, "name": "selfie", "sub_channels": ["selfie"]}
    serializer = ChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "sub_channels" in serializer.errors


def test_create_channel_bad_subchannel_values(base_channel_data):
    """Validation should fail if subchannel data is not a list of strings"""
    data = {**base_channel_data, "sub_channels": [{"name": "fake"}]}
    serializer = ChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "sub_channels" in serializer.errors


def test_update_channel():
    """
    Test updating a channel
    """
    new_channel_title = "Biology"
    new_about = {"foo": "bar"}
    new_name = "biology"

    department = LearningResourceDepartmentFactory.create()
    channel = ChannelFactory.create(is_topic=True)
    assert channel.channel_type == ChannelType.topic.name
    assert channel.topic_detail is not None

    lists = ChannelListFactory.create_batch(2, channel=channel)
    sub_channels = SubChannelFactory.create_batch(2, parent_channel=channel)
    data = {
        "title": new_channel_title,
        "name": new_name,
        "about": new_about,
        "lists": [lists[0].channel_list.id],
        "sub_channels": [sub_channels[1].channel.name],
        "featured_list": lists[0].channel_list.id,
        "channel_type": ChannelType.department.name,
        "department_detail": {"department": department.department_id},
    }
    serializer = ChannelWriteSerializer(instance=channel, data=data)
    assert serializer.is_valid() is True
    serializer.update(channel, serializer.validated_data)
    channel.refresh_from_db()
    assert channel.title == new_channel_title
    assert channel.about == new_about
    assert channel.name == channel.name
    assert channel.sub_channels.count() == 1
    new_subchannel = channel.sub_channels.first()
    assert new_subchannel.channel.name == sub_channels[1].channel.name
    assert new_subchannel.parent_channel == channel
    assert new_subchannel.position == 0
    assert channel.lists.count() == 1
    assert channel.lists.first().channel_list.id == lists[0].channel_list.id
    assert channel.featured_list == lists[0].channel_list
    assert channel.channel_type == ChannelType.department.name
    assert channel.department_detail.department == department
    assert getattr(channel, "topic_detail", None) is None


@pytest.mark.parametrize("use_email", [True, False])
def test_moderator_serializer(mocker, channel, use_email):
    """Test creating moderators with the ChannelModeratorSerializer"""
    channel_user = UserFactory.create()
    if use_email:
        data = {"email": channel_user.email}
    else:
        data = {"moderator_name": channel_user.username}
    serializer = ChannelModeratorSerializer(
        data=data,
        context={"view": mocker.Mock(kwargs={"id": channel.id})},
    )
    serializer.is_valid()
    serializer.create(serializer.validated_data)
    channel_user.refresh_from_db()
    assert (
        ChannelGroupRole.objects.get(
            channel__name=channel.name, role=CHANNEL_ROLE_MODERATORS
        ).group
        in channel_user.groups.all()
    )
