"""Tests for channels.serializers"""

from types import SimpleNamespace
from urllib.parse import urljoin

import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile

from channels.constants import FIELD_ROLE_MODERATORS, ChannelType
from channels.factories import (
    ChannelDepartmentDetailFactory,
    ChannelPathwayDetailFactory,
    ChannelTopicDetailFactory,
    ChannelUnitDetailFactory,
    FieldChannelFactory,
    FieldListFactory,
    SubfieldFactory,
)
from channels.models import FieldChannelGroupRole
from channels.serializers import (
    ChannelDepartmentDetailSerializer,
    ChannelPathwayDetailSerializer,
    ChannelTopicDetailSerializer,
    ChannelUnitDetailSerializer,
    FieldChannelCreateSerializer,
    FieldChannelSerializer,
    FieldChannelWriteSerializer,
    FieldModeratorSerializer,
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

# pylint:disable=redefined-outer-name
pytestmark = pytest.mark.django_db


small_gif = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04"
    b"\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02"
    b"\x02\x4c\x01\x00\x3b"
)


@pytest.fixture()
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
            instance=ChannelUnitDetailFactory.build(offeror=offeror)
        ).data,
        pathway=ChannelPathwayDetailSerializer(
            instance=ChannelPathwayDetailFactory.build()
        ).data,
    )


def mock_image_file(filename):
    """Return a File object with a given name"""
    return SimpleUploadedFile(filename, small_gif, content_type="image/gif")


@pytest.fixture()
def base_field_data():
    """Base field channel data for serializers"""  # noqa: D401
    return {
        "name": "my_field_name",
        "channel_type": ChannelType.pathway.name,
        "title": "my_title",
        "about": {"foo": "bar"},
        "public_description": "my desc",
    }


@pytest.mark.parametrize("has_avatar", [True, False])
@pytest.mark.parametrize("has_banner", [True, False])
@pytest.mark.parametrize("has_about", [True, False])
@pytest.mark.parametrize("ga_tracking_id", ["", "abc123"])
def test_serialize_field_channel(  # pylint: disable=too-many-arguments
    mocker, has_avatar, has_banner, has_about, ga_tracking_id
):
    """
    Test serializing a field channel
    """

    mocker.patch("channels.models.ResizeToFit", autospec=True)
    channel = FieldChannelFactory.create(
        banner=mock_image_file("banner.jpg") if has_banner else None,
        avatar=mock_image_file("avatar.jpg") if has_avatar else None,
        about={"foo": "bar"} if has_about else None,
        ga_tracking_id=ga_tracking_id,
        channel_type=ChannelType.unit.name,
        search_filter="offered_by=ocw",
    )

    field_lists = FieldListFactory.create_batch(3, field_channel=channel)

    assert FieldChannelSerializer(channel).data == {
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
        "channel_url": urljoin(
            settings.SITE_BASE_URL, f"/c/{channel.channel_type}/{channel.name}/"
        ),
        "lists": [
            LearningPathPreviewSerializer(field_list.field_list).data
            for field_list in sorted(
                field_lists,
                key=lambda l: l.position,  # noqa: E741
            )
        ],
        "subfields": [],
        "featured_list": None,
        "public_description": channel.public_description,
        "is_moderator": False,
        "configuration": {},
        "search_filter": channel.search_filter,
        "channel_type": ChannelType.unit.name,
        "unit_detail": {
            "offeror": LearningResourceOfferorDetailSerializer(
                instance=channel.unit_detail.offeror
            ).data,
        },
    }


@pytest.mark.parametrize("channel_type", ChannelType.names())
def test_create_field_channel(base_field_data, channel_detail, channel_type):
    """
    Test creating a field channel
    """
    paths = sorted(
        (p.learning_resource for p in LearningPathFactory.create_batch(2)),
        key=lambda list: list.id,  # noqa: A002
        reverse=True,
    )

    detail = {f"{channel_type}_detail": getattr(channel_detail, f"{channel_type}")}

    data = {
        **base_field_data,
        **detail,
        "featured_list": paths[0].id,
        "lists": [path.id for path in paths],
        "channel_type": channel_type,
        "configuration": {
            "key": "value",
        },
    }
    serializer = FieldChannelCreateSerializer(data=data)
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
        field_list.field_list.id
        for field_list in channel.lists.all().order_by("position")
    ] == [path.id for path in paths]
    for name in ChannelType.names():
        assert (getattr(channel, f"{name}_detail", None) is not None) is (
            name == channel_type
        )


def test_create_and_write_response_serialization():
    """
    Test that the create and write serializers return the same data as the read serializer
    """
    channel = FieldChannelFactory.create()
    assert FieldChannelCreateSerializer().to_representation(
        channel
    ) == FieldChannelSerializer().to_representation(channel)
    assert FieldChannelWriteSerializer().to_representation(
        channel
    ) == FieldChannelSerializer().to_representation(channel)


def test_create_field_channel_private_list(base_field_data):
    """Validation should fail if a list is private"""
    learning_path = LearningPathFactory.create(is_unpublished=True)
    data = {
        **base_field_data,
        "featured_list": learning_path.id,
        "lists": [learning_path.id],
    }
    serializer = FieldChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "featured_list" in serializer.errors


def test_create_field_channel_bad_list_values(base_field_data):
    """Validation should fail if lists field has non-integer values"""
    data = {**base_field_data, "lists": ["my_list"]}
    serializer = FieldChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "lists" in serializer.errors


def test_create_field_channel_with_subfields(base_field_data):
    """Field channels can be created with subfields"""
    other_fields = sorted(
        FieldChannelFactory.create_batch(2), key=lambda field: field.id, reverse=True
    )
    data = {
        **base_field_data,
        "subfields": [other_field.name for other_field in other_fields],
    }
    serializer = FieldChannelCreateSerializer(data=data)
    assert serializer.is_valid() is True
    field_channel = serializer.create(serializer.validated_data)
    for other_field in other_fields:
        assert other_field.name in field_channel.subfields.values_list(
            "field_channel__name", flat=True
        ).order_by("position")


def test_create_field_channel_not_existing_subfields(base_field_data):
    """Validation should fail if a subfield does not exist"""
    data = {**base_field_data, "subfields": ["fake"]}
    serializer = FieldChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "subfields" in serializer.errors


def test_create_field_channel_self_reference_subfields(base_field_data):
    """Validation should fail if field is subfield of itself"""
    data = {**base_field_data, "name": "selfie", "subfields": ["selfie"]}
    serializer = FieldChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "subfields" in serializer.errors


def test_create_field_channel_bad_subfield_values(base_field_data):
    """Validation should fail if subfield data is not a list of strings"""
    data = {**base_field_data, "subfields": [{"name": "fake"}]}
    serializer = FieldChannelCreateSerializer(data=data)
    assert serializer.is_valid() is False
    assert "subfields" in serializer.errors


def test_update_field_channel():
    """
    Test updating a field_channel
    """
    new_field_title = "Biology"
    new_about = {"foo": "bar"}
    new_name = "biology"

    department = LearningResourceDepartmentFactory.create()
    channel = FieldChannelFactory.create(is_topic=True)
    assert channel.channel_type == ChannelType.topic.name
    assert channel.topic_detail is not None

    lists = FieldListFactory.create_batch(2, field_channel=channel)
    subfields = SubfieldFactory.create_batch(2, parent_channel=channel)
    data = {
        "title": new_field_title,
        "name": new_name,
        "about": new_about,
        "lists": [lists[0].field_list.id],
        "subfields": [subfields[1].field_channel.name],
        "featured_list": lists[0].field_list.id,
        "channel_type": ChannelType.department.name,
        "department_detail": {"department": department.department_id},
    }
    serializer = FieldChannelWriteSerializer(instance=channel, data=data)
    assert serializer.is_valid() is True
    serializer.update(channel, serializer.validated_data)
    channel.refresh_from_db()
    assert channel.title == new_field_title
    assert channel.about == new_about
    assert channel.name == channel.name
    assert channel.subfields.count() == 1
    new_subfield = channel.subfields.first()
    assert new_subfield.field_channel.name == subfields[1].field_channel.name
    assert new_subfield.parent_channel == channel
    assert new_subfield.position == 0
    assert channel.lists.count() == 1
    assert channel.lists.first().field_list.id == lists[0].field_list.id
    assert channel.featured_list == lists[0].field_list
    assert channel.channel_type == ChannelType.department.name
    assert channel.department_detail.department == department
    assert getattr(channel, "topic_detail", None) is None


@pytest.mark.parametrize("use_email", [True, False])
def test_moderator_serializer(mocker, field_channel, use_email):
    """Test creating moderators with the FieldModeratorSerializer"""
    field_user = UserFactory.create()
    if use_email:
        data = {"email": field_user.email}
    else:
        data = {"moderator_name": field_user.username}
    serializer = FieldModeratorSerializer(
        data=data,
        context={"view": mocker.Mock(kwargs={"id": field_channel.id})},
    )
    serializer.is_valid()
    serializer.create(serializer.validated_data)
    field_user.refresh_from_db()
    assert (
        FieldChannelGroupRole.objects.get(
            field__name=field_channel.name, role=FIELD_ROLE_MODERATORS
        ).group
        in field_user.groups.all()
    )
