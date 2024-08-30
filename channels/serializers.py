"""Serializers for channels"""

import copy
import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from channels.api import add_user_role
from channels.constants import CHANNEL_ROLE_MODERATORS, ChannelType
from channels.models import (
    Channel,
    ChannelDepartmentDetail,
    ChannelList,
    ChannelPathwayDetail,
    ChannelTopicDetail,
    ChannelUnitDetail,
    SubChannel,
)
from learning_resources.constants import LearningResourceType
from learning_resources.models import (
    LearningResource,
)
from learning_resources.serializers import LearningResourceOfferorDetailSerializer
from main.serializers import COMMON_IGNORED_FIELDS
from profiles.models import Profile

User = get_user_model()

log = logging.getLogger(__name__)


class ChannelTypeChoiceField(serializers.ChoiceField):
    """Field for Channel.channel_type"""

    def __init__(self, **kwargs):
        kwargs.setdefault("required", True)
        super().__init__(ChannelType.as_tuple(), **kwargs)


class ChannelTypeConstantField(serializers.ReadOnlyField):
    """Field for Channel.channel_type"""


class WriteableSerializerMethodField(serializers.SerializerMethodField):
    """
    A SerializerMethodField which has been marked as not read_only so that submitted data passed validation.
    """  # noqa: E501

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.read_only = False

    def to_internal_value(self, data):
        return data


class LearningPathPreviewSerializer(serializers.ModelSerializer):
    """Serializer for a minimal preview of Learning Paths"""

    class Meta:
        model = LearningResource
        fields = ("title", "url", "id")


class ChannelAppearanceMixin(serializers.Serializer):
    """Serializer mixin for channel appearance"""

    avatar = WriteableSerializerMethodField()
    avatar_small = serializers.SerializerMethodField()
    avatar_medium = serializers.SerializerMethodField()
    banner = WriteableSerializerMethodField()
    is_moderator = serializers.SerializerMethodField()

    def get_is_moderator(self, instance) -> bool:
        """Return true if user is a moderator for the channel"""
        request = self.context.get("request")
        if not request or not request.user or not instance:
            return False
        moderated_channel_ids = self.context.get("moderated_channel_ids", [])
        return request.user.is_staff or instance.id in moderated_channel_ids

    def get_avatar(self, channel) -> str | None:
        """Get the avatar image URL"""
        return channel.avatar.url if channel.avatar else None

    def get_avatar_small(self, channel) -> str | None:
        """Get the avatar image small URL"""
        return channel.avatar_small.url if channel.avatar_small else None

    def get_avatar_medium(self, channel) -> str | None:
        """Get the avatar image medium URL"""
        return channel.avatar_medium.url if channel.avatar_medium else None

    def get_banner(self, channel) -> str | None:
        """Get the banner image URL"""
        return channel.banner.url if channel.banner else None

    def validate_avatar(self, value):
        """Empty validation function, but this is required for WriteableSerializerMethodField"""  # noqa: E501
        if not hasattr(value, "name"):
            msg = "Expected avatar to be a file"
            raise ValidationError(msg)
        return {"avatar": value}

    def validate_banner(self, value):
        """Empty validation function, but this is required for WriteableSerializerMethodField"""  # noqa: E501
        if not hasattr(value, "name"):
            msg = "Expected banner to be a file"
            raise ValidationError(msg)
        return {"banner": value}


class SubChannelSerializer(serializers.ModelSerializer):
    """Serializer for SubChannels"""

    parent_channel = serializers.SlugRelatedField(
        many=False, read_only=True, slug_field="name"
    )

    channel = serializers.SlugRelatedField(
        many=False, read_only=True, slug_field="name"
    )

    class Meta:
        model = SubChannel
        fields = ("parent_channel", "channel", "position")


class ChannelBaseSerializer(ChannelAppearanceMixin, serializers.ModelSerializer):
    """Serializer for Channel"""

    lists = serializers.SerializerMethodField()
    channel_url = serializers.SerializerMethodField(read_only=True)
    featured_list = LearningPathPreviewSerializer(
        allow_null=True,
        many=False,
        read_only=True,
        help_text="Learning path featured in this channel.",
    )
    sub_channels = SubChannelSerializer(many=True, read_only=True)

    @extend_schema_field(LearningPathPreviewSerializer(many=True))
    def get_lists(self, instance):
        """Return the channel's list of LearningPaths"""
        return [
            LearningPathPreviewSerializer(channel_list.channel_list).data
            for channel_list in instance.lists.all()
        ]

    def get_channel_url(self, instance) -> str:
        """Get the URL for the channel"""
        return instance.channel_url

    class Meta:
        model = Channel
        exclude = ["published"]


class ChannelCountsSerializer(serializers.ModelSerializer):
    counts = serializers.SerializerMethodField(read_only=True)
    channel_url = serializers.SerializerMethodField(read_only=True)

    def get_channel_url(self, instance) -> str:
        """Get the URL for the channel"""
        return instance.channel_url

    def get_counts(self, instance):
        if instance.channel_type == "unit":
            resources = instance.unit_detail.unit.learningresource_set.all()
        elif instance.channel_type == "department":
            resources = instance.department_detail.department.learningresource_set.all()
        elif instance.channel_type == "topic":
            resources = instance.topic_detail.topic.learningresource_set.all()
        course_count = resources.filter(course__isnull=False, published=True).count()
        program_count = resources.filter(program__isnull=False, published=True).count()
        return {"courses": course_count, "programs": program_count}

    class Meta:
        model = Channel
        exclude = [
            "avatar",
            "published",
            "banner",
            "about",
            "configuration",
            "public_description",
            "ga_tracking_id",
            "featured_list",
            "widget_list",
        ]


class ChannelTopicDetailSerializer(serializers.ModelSerializer):
    """Serializer for the ChannelTopicDetail model"""

    class Meta:
        model = ChannelTopicDetail
        exclude = ("channel", *COMMON_IGNORED_FIELDS)


class TopicChannelSerializer(ChannelBaseSerializer):
    """Serializer for Channel model of type topic"""

    channel_type = ChannelTypeConstantField(default=ChannelType.topic.name)
    topic_detail = ChannelTopicDetailSerializer()


class ChannelDepartmentDetailSerializer(serializers.ModelSerializer):
    """Serializer for the ChannelDepartmentDetail model"""

    class Meta:
        model = ChannelDepartmentDetail
        exclude = ("channel", *COMMON_IGNORED_FIELDS)


class DepartmentChannelSerializer(ChannelBaseSerializer):
    """Serializer for Channel model of type department"""

    channel_type = ChannelTypeConstantField(default=ChannelType.department.name)

    department_detail = ChannelDepartmentDetailSerializer()


class ChannelUnitDetailSerializer(serializers.ModelSerializer):
    """Serializer for the ChannelOfferorDetail model"""

    unit = LearningResourceOfferorDetailSerializer(read_only=True)

    class Meta:
        model = ChannelUnitDetail
        exclude = ("channel", *COMMON_IGNORED_FIELDS)


class UnitChannelSerializer(ChannelBaseSerializer):
    """Serializer for Channel model of type unit"""

    channel_type = ChannelTypeConstantField(default=ChannelType.unit.name)

    unit_detail = ChannelUnitDetailSerializer()


class ChannelPathwayDetailSerializer(serializers.ModelSerializer):
    """Serializer for the ChannelPathwayDetail model"""

    class Meta:
        model = ChannelPathwayDetail
        exclude = ("channel", *COMMON_IGNORED_FIELDS)


class PathwayChannelSerializer(ChannelBaseSerializer):
    """Serializer for Channel model of type pathway"""

    channel_type = ChannelTypeConstantField(default=ChannelType.pathway.name)

    pathway_detail = ChannelPathwayDetailSerializer()


class ChannelSerializer(serializers.Serializer):
    """Serializer for Channel"""

    serializer_cls_mapping = {
        serializer_cls().fields["channel_type"].default: serializer_cls
        for serializer_cls in (
            TopicChannelSerializer,
            DepartmentChannelSerializer,
            UnitChannelSerializer,
            PathwayChannelSerializer,
        )
    }

    def to_representation(self, instance):
        """Serialize a Channel based on channel_type"""
        serializer_cls = self.serializer_cls_mapping[instance.channel_type]

        return serializer_cls(instance=instance, context=self.context).data


class ChannelCreateSerializer(serializers.ModelSerializer):
    """
    Write serializer for Channel. Uses primary keys for referenced objects
    during requests, and delegates to ChannelSerializer for responses.
    """

    channel_type = ChannelTypeChoiceField(required=True)

    featured_list = serializers.PrimaryKeyRelatedField(
        many=False,
        allow_null=True,
        allow_empty=True,
        required=False,
        queryset=LearningResource.objects.filter(
            published=True,
            resource_type=LearningResourceType.learning_path.name,
        ),
        help_text="Learning path featured in this channel.",
    )
    lists = serializers.PrimaryKeyRelatedField(
        many=True,
        allow_null=True,
        allow_empty=True,
        required=False,
        queryset=LearningResource.objects.filter(
            published=True,
            resource_type=LearningResourceType.learning_path.name,
        ),
        help_text="Learning paths in this channel.",
    )
    sub_channels = serializers.SlugRelatedField(
        slug_field="name",
        many=True,
        queryset=Channel.objects.all(),
        required=False,
    )
    topic_detail = ChannelTopicDetailSerializer(
        allow_null=True, many=False, required=False
    )
    department_detail = ChannelDepartmentDetailSerializer(
        allow_null=True, many=False, required=False
    )
    unit_detail = ChannelUnitDetailSerializer(
        allow_null=True, many=False, required=False
    )
    pathway_detail = ChannelPathwayDetailSerializer(
        allow_null=True, many=False, required=False
    )
    configuration = serializers.JSONField(read_only=True)

    class Meta:
        model = Channel
        fields = (
            "name",
            "title",
            "public_description",
            "sub_channels",
            "featured_list",
            "lists",
            "avatar",
            "banner",
            "about",
            "channel_type",
            "search_filter",
            "configuration",
            "topic_detail",
            "department_detail",
            "unit_detail",
            "pathway_detail",
        )

    def upsert_channel_lists(self, instance, validated_data):
        """Update or create channel lists for a new or updated channel"""
        if "lists" not in validated_data:
            return
        channel_lists = validated_data.pop("lists")
        new_lists = set()
        former_lists = list(instance.lists.values_list("id", flat=True))
        for idx, learning_path in enumerate(channel_lists):
            channel_list, _ = ChannelList.objects.update_or_create(
                channel=instance,
                channel_list=learning_path,
                defaults={"position": idx},
            )
            new_lists.add(channel_list)
        removed_lists = list(
            set(former_lists) - {list.id for list in new_lists}  # noqa: A001
        )
        with transaction.atomic():
            instance.lists.set(new_lists)
            instance.lists.filter(id__in=removed_lists).delete()

    def upsert_sub_channels(self, instance, validated_data):
        """Update or create sub_channels for a new or updated channel"""
        if "sub_channels" not in validated_data:
            return
        sub_channels = validated_data.pop("sub_channels")
        new_sub_channels = set()
        former_sub_channels = list(
            instance.sub_channels.values_list("channel__name", flat=True)
        )
        for idx, channel in enumerate(sub_channels):
            if channel.pk == instance.pk:
                msg = "A channel cannot be a sub_channel of itself"
                raise ValidationError(msg)
            sub_channel, _ = SubChannel.objects.update_or_create(
                parent_channel=instance,
                channel=channel,
                defaults={"position": idx},
            )
            new_sub_channels.add(sub_channel)
        removed_sub_channels = list(
            set(former_sub_channels)
            - {sub_channel.channel.name for sub_channel in new_sub_channels}
        )
        with transaction.atomic():
            instance.sub_channels.set(new_sub_channels)
            instance.sub_channels.filter(
                channel__name__in=removed_sub_channels
            ).delete()

    def upsert_details(self, channel, validated_data):
        """Update/create details for a new or updated channel"""
        channel_detail_map = {
            ChannelType.topic.name: ChannelTopicDetail,
            ChannelType.department.name: ChannelDepartmentDetail,
            ChannelType.unit.name: ChannelUnitDetail,
            ChannelType.pathway.name: ChannelPathwayDetail,
        }
        channel_type = validated_data.get("channel_type", channel.channel_type)

        for key in ChannelType.names():
            details_data = validated_data.pop(f"{key}_detail", None)
            if key == channel_type:
                channel_detail_map[key].objects.update_or_create(
                    channel=channel, defaults=details_data
                )
            else:
                channel_detail_map[key].objects.filter(channel=channel).delete()

    def create(self, validated_data):
        base_field_data = copy.deepcopy(validated_data)
        for key in (
            "sub_channels",
            "lists",
            "topic_detail",
            "department_detail",
            "unit_detail",
            "pathway_detail",
        ):
            base_field_data.pop(key, None)
        with transaction.atomic():
            channel = super().create(base_field_data)
            self.upsert_channel_lists(channel, validated_data)
            self.upsert_sub_channels(channel, validated_data)
            self.upsert_details(channel, validated_data)
            return channel

    def to_representation(self, data):
        return ChannelSerializer(context=self.context).to_representation(data)


class ChannelWriteSerializer(ChannelCreateSerializer, ChannelAppearanceMixin):
    """Similar to ChannelCreateSerializer, with read-only name"""

    class Meta:
        model = Channel
        fields = ChannelCreateSerializer.Meta.fields
        read_only_fields = ("id",)

    def update(self, instance, validated_data):
        """Update an existing channel"""
        self.upsert_channel_lists(instance, validated_data)
        self.upsert_sub_channels(instance, validated_data)
        self.upsert_details(instance, validated_data)

        avatar = validated_data.pop("avatar", None)
        if avatar:
            instance.avatar.save(
                f"channel_avatar_{instance.name}.jpg", avatar, save=False
            )
            instance.save(update_fields=["avatar"])

        banner = validated_data.pop("banner", None)
        if banner:
            instance.banner.save(
                f"channel_banner_{instance.name}.jpg", banner, save=False
            )
            instance.save(update_fields=["banner"])
        return super().update(instance, validated_data)


class ChannelModeratorSerializer(serializers.Serializer):
    """Serializer for moderators"""

    moderator_name = WriteableSerializerMethodField()
    email = WriteableSerializerMethodField()
    full_name = serializers.SerializerMethodField()

    def get_moderator_name(self, instance) -> str:
        """Returns the name for the moderator"""  # noqa: D401
        return instance.username

    def get_email(self, instance) -> str:
        """Get the email from the associated user"""
        return (
            User.objects.filter(username=instance.username)
            .values_list("email", flat=True)
            .first()
        )

    def get_full_name(self, instance) -> str:
        """Get the full name of the associated user"""
        return (
            Profile.objects.filter(user__username=instance.username)
            .values_list("name", flat=True)
            .first()
        )

    def validate_moderator_name(self, value):
        """Validate moderator name"""
        if not isinstance(value, str):
            msg = "username must be a string"
            raise ValidationError(msg)
        if not User.objects.filter(username=value).exists():
            msg = "username is not a valid user"
            raise ValidationError(msg)
        return {"moderator_name": value}

    def validate_email(self, value):
        """Validate email"""
        if not isinstance(value, str):
            msg = "email must be a string"
            raise ValidationError(msg)
        if not User.objects.filter(email__iexact=value).exists():
            msg = "email does not exist"
            raise ValidationError(msg)
        return {"email": value}

    def create(self, validated_data):
        channel_id = self.context["view"].kwargs["id"]
        moderator_name = validated_data.get("moderator_name")
        email = validated_data.get("email")

        if email and moderator_name:
            msg = "Only one of moderator_name, email should be specified"
            raise ValueError(msg)

        if moderator_name:
            username = moderator_name
        elif email:
            username = User.objects.get(email__iexact=email).username
        else:
            msg = "Missing moderator_name or email"
            raise ValueError(msg)

        user = User.objects.get(username=username)
        add_user_role(Channel.objects.get(id=channel_id), CHANNEL_ROLE_MODERATORS, user)
        return user
