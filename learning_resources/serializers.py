"""Serializers for learning_resources"""

import logging
from decimal import Decimal
from uuid import uuid4

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F, Max
from drf_spectacular.helpers import lazy_serializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from channels.models import Channel
from learning_resources import constants, models
from learning_resources.constants import (
    CertificationType,
    LearningResourceFormat,
    LearningResourceType,
    LevelType,
)
from learning_resources.etl.loaders import update_index
from learning_resources.models import LearningResource, LearningResourceRelationship
from main.serializers import COMMON_IGNORED_FIELDS, WriteableSerializerMethodField

log = logging.getLogger(__name__)


class LearningResourceInstructorSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceInstructor model
    """

    class Meta:
        model = models.LearningResourceInstructor
        exclude = COMMON_IGNORED_FIELDS


class LearningResourceTopicSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceTopic model
    """

    channel_url = serializers.SerializerMethodField(read_only=True, allow_null=True)

    def get_channel_url(self, instance: models.LearningResourceTopic) -> str or None:
        """Get the channel url for the topic if it exists"""
        channel = Channel.objects.filter(topic_detail__topic=instance).first()
        return channel.channel_url if channel else None

    class Meta:
        """Meta options for the serializer."""

        model = models.LearningResourceTopic
        fields = ["id", "name", "parent", "channel_url"]


class WriteableTopicsMixin(serializers.Serializer):
    """Class for editable topics"""

    topics = WriteableSerializerMethodField()

    def validate_topics(self, topics):
        """Validate specified topics exist."""
        if len(topics) > 0:
            if isinstance(topics[0], dict):
                topics = [topic["id"] for topic in topics]
            try:
                valid_topic_ids = set(
                    models.LearningResourceTopic.objects.filter(
                        id__in=topics
                    ).values_list("id", flat=True)
                )
            except ValueError as ve:
                msg = "Topic ids must be integers"
                raise ValidationError(msg) from ve
            missing = set(topics).difference(valid_topic_ids)
            if missing:
                msg = f"Invalid topic ids: {missing}"
                raise ValidationError(msg)
        return {"topics": topics}

    @extend_schema_field(LearningResourceTopicSerializer(many=True))
    def get_topics(self, instance):
        """Return the list of topics"""
        return [
            LearningResourceTopicSerializer(topic).data
            for topic in instance.topics.all()
        ]


class LearningResourceTypeField(serializers.ReadOnlyField):
    """Field for LearningResource.resource_type"""


class LearningResourceOfferorSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceOfferor with basic details"""

    channel_url = serializers.SerializerMethodField(read_only=True, allow_null=True)

    def get_channel_url(self, instance: models.LearningResourceOfferor) -> str or None:
        """Get the channel url for the offeror if it exists"""
        channel = Channel.objects.filter(unit_detail__unit=instance).first()
        return channel.channel_url if channel else None

    class Meta:
        model = models.LearningResourceOfferor
        fields = ("code", "name", "channel_url")


class LearningResourceOfferorDetailSerializer(LearningResourceOfferorSerializer):
    """Serializer for LearningResourceOfferor with all details"""

    class Meta:
        model = models.LearningResourceOfferor
        exclude = COMMON_IGNORED_FIELDS


@extend_schema_field(
    {
        "type": "object",
        "properties": {
            "code": {"enum": CertificationType.names()},
            "name": {"type": "string"},
        },
        "required": ["code", "name"],
    }
)
class CertificateTypeField(serializers.Field):
    """Serializer for LearningResource.certification_type"""

    def to_representation(self, value):
        """Serialize certification type as a dict"""
        return {"code": value, "name": CertificationType[value].value}


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceContentTagField(serializers.Field):
    """Serializer for LearningResourceContentTag"""

    def to_representation(self, value):
        """Serialize content tags as a list of names"""
        return sorted([tag.name for tag in value.all()])


class LearningResourcePlatformSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourcePlatform"""

    class Meta:
        model = models.LearningResourcePlatform
        fields = ("code", "name")


class LearningResourceBaseDepartmentSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceDepartment, minus school"""

    channel_url = serializers.SerializerMethodField(read_only=True, allow_null=True)

    def get_channel_url(
        self, instance: models.LearningResourceDepartment
    ) -> str or None:
        """Get the channel url for the department if it exists"""
        channel = Channel.objects.filter(department_detail__department=instance).first()
        return channel.channel_url if channel else None

    class Meta:
        model = models.LearningResourceDepartment
        fields = ["department_id", "name", "channel_url"]


class LearningResourceBaseSchoolSerializer(serializers.ModelSerializer):
    """
    Base serializer for LearningResourceSchool model, minus departments list
    """

    class Meta:
        model = models.LearningResourceSchool
        fields = ["id", "name", "url"]


class LearningResourceDepartmentSerializer(LearningResourceBaseDepartmentSerializer):
    """Full serializer for LearningResourceDepartment, including school"""

    school = LearningResourceBaseSchoolSerializer(read_only=True, allow_null=True)

    class Meta:
        model = models.LearningResourceDepartment
        fields = [*LearningResourceBaseDepartmentSerializer.Meta.fields, "school"]


class LearningResourceSchoolSerializer(LearningResourceBaseSchoolSerializer):
    """
    Serializer for LearningResourceSchool model, including list of departments
    """

    departments = LearningResourceBaseDepartmentSerializer(many=True)

    class Meta:
        model = models.LearningResourceSchool
        fields = [*LearningResourceBaseSchoolSerializer.Meta.fields, "departments"]


class LearningResourceContentTagSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceContentTag"""

    class Meta:
        model = models.LearningResourceContentTag
        fields = ["id", "name"]


class LearningResourceImageSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceImage"""

    class Meta:
        model = models.LearningResourceImage
        exclude = COMMON_IGNORED_FIELDS


@extend_schema_field(
    {
        "type": "object",
        "properties": {
            "code": {"enum": LevelType.names()},
            "name": {"type": "string"},
        },
        "required": ["code", "name"],
    }
)
class LearningResourceLevelSerializer(serializers.Field):
    def to_representation(self, value):
        return {"code": value, "name": LevelType[value].value}


@extend_schema_field(
    {
        "type": "object",
        "properties": {
            "code": {"enum": LearningResourceFormat.names()},
            "name": {"type": "string"},
        },
        "required": ["code", "name"],
    }
)
class LearningResourceFormatSerializer(serializers.Field):
    def to_representation(self, value):
        return {"code": value, "name": LearningResourceFormat[value].value}


class LearningResourceRunSerializer(serializers.ModelSerializer):
    """Serializer for the LearningResourceRun model"""

    instructors = LearningResourceInstructorSerializer(
        read_only=True, allow_null=True, many=True
    )
    image = LearningResourceImageSerializer(read_only=True, allow_null=True)

    level = serializers.ListField(child=LearningResourceLevelSerializer())

    class Meta:
        model = models.LearningResourceRun
        exclude = ["learning_resource", *COMMON_IGNORED_FIELDS]


class ResourceListMixin(serializers.Serializer):
    """Common fields for LearningPath and other future resource lists"""

    item_count = serializers.SerializerMethodField()

    def get_item_count(self, instance) -> int:
        """Return the number of items in the list"""
        return (
            getattr(instance, "item_count", None)
            or instance.learning_resource.children.count()
        )


class CourseNumberSerializer(serializers.Serializer):
    """Serializer for CourseNumber"""

    value = serializers.CharField()
    department = LearningResourceDepartmentSerializer()
    listing_type = serializers.CharField()


class ProgramSerializer(serializers.ModelSerializer):
    """Serializer for the Program model"""

    courses = serializers.SerializerMethodField()

    @extend_schema_field(
        lazy_serializer("learning_resources.serializers.CourseResourceSerializer")(
            many=True, allow_null=True
        )
    )
    def get_courses(self, obj):
        """Get the learning resource courses for a program"""
        ids = (
            LearningResourceRelationship.objects.filter(
                parent_id=obj.learning_resource.id, child__published=True
            )
            .values_list("child_id", flat=True)
            .distinct()
        )
        return CourseResourceSerializer(
            list(
                LearningResource.objects.filter(id__in=ids)
                .select_related(*LearningResource.related_selects)
                .prefetch_related(*LearningResource.prefetches)
                .order_by("next_start_date", "id")
            ),
            many=True,
        ).data

    class Meta:
        model = models.Program
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for the Course model"""

    course_numbers = CourseNumberSerializer(many=True, allow_null=True)

    class Meta:
        model = models.Course
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class LearningPathSerializer(serializers.ModelSerializer, ResourceListMixin):
    """Serializer for the LearningPath model"""

    class Meta:
        model = models.LearningPath
        exclude = ("learning_resource", "author", *COMMON_IGNORED_FIELDS)


class PodcastEpisodeSerializer(serializers.ModelSerializer):
    """
    Serializer for PodcastEpisode
    """

    class Meta:
        model = models.PodcastEpisode
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class PodcastSerializer(serializers.ModelSerializer):
    """
    Serializer for Podcasts
    """

    episode_count = serializers.SerializerMethodField()

    def get_episode_count(self, instance) -> int:
        """Return the number of episodes in the podcast"""
        return instance.learning_resource.children.filter(
            relation_type=constants.LearningResourceRelationTypes.PODCAST_EPISODES.value
        ).count()

    class Meta:
        model = models.Podcast
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class VideoChannelSerializer(serializers.ModelSerializer):
    """Serializer for the VideoChannel model"""

    class Meta:
        model = models.VideoChannel
        exclude = ["published", *COMMON_IGNORED_FIELDS]


class VideoSerializer(serializers.ModelSerializer):
    """Serializer for the Video model"""

    class Meta:
        model = models.Video
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class VideoPlaylistSerializer(serializers.ModelSerializer):
    """Serializer for the VideoPlaylist model"""

    channel = VideoChannelSerializer(read_only=True, allow_null=True)

    video_count = serializers.SerializerMethodField()

    def get_video_count(self, instance) -> int:
        """Return the number of videos in the playlist"""
        return instance.learning_resource.children.filter(
            relation_type=constants.LearningResourceRelationTypes.PLAYLIST_VIDEOS.value
        ).count()

    class Meta:
        model = models.VideoPlaylist
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class MicroLearningPathRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer containing only parent and child ids for a learning path relationship
    """

    parent = serializers.ReadOnlyField(
        source="parent_id",
        help_text="The id of the parent learning resource",
    )
    child = serializers.ReadOnlyField(source="child_id")

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("id", "parent", "child")


class MicroUserListRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer containing only parent and child ids for a user list relationship
    """

    parent = serializers.ReadOnlyField(
        source="parent_id", help_text="The id of the parent learning resource"
    )
    child = serializers.ReadOnlyField(source="child_id")

    class Meta:
        model = models.UserListRelationship
        fields = ("id", "parent", "child")


class LearningResourceBaseSerializer(serializers.ModelSerializer, WriteableTopicsMixin):
    """Serializer for LearningResource, minus program"""

    offered_by = LearningResourceOfferorSerializer(read_only=True, allow_null=True)
    platform = LearningResourcePlatformSerializer(read_only=True, allow_null=True)
    course_feature = LearningResourceContentTagField(
        source="content_tags", read_only=True, allow_null=True
    )
    departments = LearningResourceDepartmentSerializer(
        read_only=True, allow_null=True, many=True
    )
    certification = serializers.ReadOnlyField(read_only=True)
    certification_type = CertificateTypeField(read_only=True)
    prices = serializers.ListField(
        child=serializers.DecimalField(max_digits=10, decimal_places=2),
        read_only=True,
    )
    runs = LearningResourceRunSerializer(read_only=True, many=True, allow_null=True)
    image = serializers.SerializerMethodField()
    learning_path_parents = serializers.SerializerMethodField()
    user_list_parents = serializers.SerializerMethodField()
    views = serializers.SerializerMethodField()
    learning_format = serializers.ListField(
        child=LearningResourceFormatSerializer(), read_only=True
    )
    free = serializers.SerializerMethodField()

    def get_free(self, instance) -> bool:
        """Return true if the resource is free/has a free option"""
        if instance.resource_type in [
            LearningResourceType.course.name,
            LearningResourceType.program.name,
        ]:
            prices = instance.prices
            return not instance.professional and (
                Decimal(0.00) in prices or not prices or prices == []
            )
        else:
            return True

    @extend_schema_field(LearningResourceImageSerializer(allow_null=True))
    def get_image(self, instance) -> dict:
        """
        Return the resource.image if it exists. Otherwise, for learning paths only,
        return the image of the first child resource.
        """
        if instance.image:
            return LearningResourceImageSerializer(instance=instance.image).data
        elif (
            instance.resource_type == constants.LearningResourceType.learning_path.value
        ):
            list_item = instance.children.order_by("position").first()
            if list_item and list_item.child.image:
                return LearningResourceImageSerializer(
                    instance=list_item.child.image
                ).data
            return None
        return None

    @extend_schema_field(
        MicroLearningPathRelationshipSerializer(many=True, allow_null=True)
    )
    def get_learning_path_parents(self, instance):
        """# noqa: D401
        Returns list of learning paths that resource is in, if the user has permission
        """
        request = self.context.get("request")
        user = request.user if request else None
        if (
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.is_superuser
                or user.groups.filter(name=constants.GROUP_STAFF_LISTS_EDITORS).first()
                is not None
            )
        ):
            return MicroLearningPathRelationshipSerializer(
                LearningResourceRelationship.objects.filter(
                    child=instance,
                    relation_type=constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value,
                ),
                many=True,
            ).data
        return []

    @extend_schema_field(
        MicroUserListRelationshipSerializer(many=True, allow_null=True)
    )
    def get_user_list_parents(self, instance):
        """Return a list of user lists that the resource is in, for specific user"""
        request = self.context.get("request")
        user = request.user if request else None
        if user and user.is_authenticated:
            return MicroUserListRelationshipSerializer(
                models.UserListRelationship.objects.filter(
                    parent__author=user, child=instance
                ),
                many=True,
            ).data
        return []

    @extend_schema_field(int)
    def get_views(self, instance):
        """Return the number of views for the resource."""

        return models.LearningResourceViewEvent.objects.filter(
            learning_resource=instance
        ).count()

    def to_representation(self, instance):
        """Filter out unpublished runs"""
        data = super().to_representation(instance)
        data["runs"] = [run for run in data["runs"] if run["published"]]
        return data

    class Meta:
        model = models.LearningResource
        read_only_fields = [
            "free",
            "certification",
            "certification_type",
            "professional",
            "views",
        ]
        exclude = ["content_tags", "resources", "etl_source", *COMMON_IGNORED_FIELDS]


class ProgramResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for program resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.program.name
    )

    program = ProgramSerializer(read_only=True)


class CourseResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for course resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.course.name
    )

    course = CourseSerializer(read_only=True)


class LearningResourceRelationshipChildField(serializers.ModelSerializer):
    """
    Serializer field for the LearningResourceRelationship model that uses
    the LearningResourceSerializer to serialize the child resources
    """

    def to_representation(self, instance):
        """Serializes child as a LearningResource"""  # noqa: D401
        return LearningResourceSerializer(instance=instance.child).data

    class Meta:
        model = models.LearningResourceRelationship
        exclude = ("parent", *COMMON_IGNORED_FIELDS)


class LearningPathResourceSerializer(LearningResourceBaseSerializer):
    """CRUD serializer for LearningPath resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.learning_path.name
    )

    learning_path = LearningPathSerializer(read_only=True)

    def validate_resource_type(self, value):
        """Only allow LearningPath resources to be CRUDed"""
        if value != constants.LearningResourceType.learning_path.name:
            msg = "Only LearningPath resources are editable"
            raise serializers.ValidationError(msg)
        return value

    def create(self, validated_data):
        """Ensure that the LearningPath is created by the requesting user; set topics"""
        # defined here because we disallow them as input
        validated_data["readable_id"] = uuid4().hex
        validated_data["resource_type"] = self.fields["resource_type"].default

        request = self.context.get("request")
        topics_data = validated_data.pop("topics", [])

        with transaction.atomic():
            path_resource = super().create(validated_data)
            path_resource.topics.set(
                models.LearningResourceTopic.objects.filter(id__in=topics_data)
            )
            models.LearningPath.objects.create(
                learning_resource=path_resource, author=request.user
            )
        update_index(path_resource, True)  # noqa: FBT003
        return path_resource

    def update(self, instance, validated_data):
        """Set learning path topics and update the model object"""
        topics_data = validated_data.pop("topics", None)
        with transaction.atomic():
            resource = super().update(instance, validated_data)
            if topics_data is not None:
                resource.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
        update_index(resource, False)  # noqa: FBT003
        return resource

    class Meta:
        model = models.LearningResource
        exclude = ["content_tags", "resources", "etl_source", *COMMON_IGNORED_FIELDS]
        read_only_fields = ["platform", "offered_by", "readable_id"]


class PodcastResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for podcast resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.podcast.name
    )

    podcast = PodcastSerializer(read_only=True)


class PodcastEpisodeResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for podcast episode resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.podcast_episode.name
    )

    podcast_episode = PodcastEpisodeSerializer(read_only=True)


class VideoResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for video resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.video.name
    )

    video = VideoSerializer(read_only=True)


class VideoPlaylistResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for video playlist resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.video_playlist.name
    )

    video_playlist = VideoPlaylistSerializer(read_only=True)


class LearningResourceSerializer(serializers.Serializer):
    """Serializer for LearningResource"""

    serializer_cls_mapping = {
        serializer_cls().fields["resource_type"].default: serializer_cls
        for serializer_cls in (
            ProgramResourceSerializer,
            CourseResourceSerializer,
            LearningPathResourceSerializer,
            PodcastResourceSerializer,
            PodcastEpisodeResourceSerializer,
            VideoResourceSerializer,
            VideoPlaylistResourceSerializer,
        )
    }

    def to_representation(self, instance):
        """Serialize a LearningResource based on resource_type"""
        serializer_cls = self.serializer_cls_mapping[instance.resource_type]

        return serializer_cls(instance=instance, context=self.context).data


class LearningResourceRelationshipSerializer(serializers.ModelSerializer):
    """CRUD serializer for LearningResourceRelationship"""

    resource = LearningResourceSerializer(read_only=True, source="child")

    def create(self, validated_data):
        resource = validated_data["parent"]
        items = models.LearningResourceRelationship.objects.filter(parent=resource)
        position = (
            items.aggregate(Max("position"))["position__max"] or items.count()
        ) + 1
        item, _ = models.LearningResourceRelationship.objects.get_or_create(
            parent=validated_data["parent"],
            child=validated_data["child"],
            relation_type=validated_data["relation_type"],
            defaults={"position": position},
        )
        return item

    def update(self, instance, validated_data):
        position = validated_data["position"]
        # to perform an update on position we atomically:
        # 1) move everything between the old position and the new position towards the old position by 1  # noqa: E501
        # 2) move the item into its new position
        # this operation gets slower the further the item is moved, but it is sufficient for now  # noqa: E501
        with transaction.atomic():
            path_items = models.LearningResourceRelationship.objects.filter(
                parent=instance.parent,
                relation_type=instance.relation_type,
            )
            if position > instance.position:
                # move items between the old and new positions up, inclusive of the new position  # noqa: E501
                path_items.filter(
                    position__lte=position, position__gt=instance.position
                ).update(position=F("position") - 1)
            else:
                # move items between the old and new positions down, inclusive of the new position  # noqa: E501
                path_items.filter(
                    position__lt=instance.position, position__gte=position
                ).update(position=F("position") + 1)
            # now move the item into place
            instance.position = position
            instance.save()

        return instance

    class Meta:
        model = models.LearningResourceRelationship
        extra_kwargs = {"position": {"required": False}}
        exclude = COMMON_IGNORED_FIELDS


class LearningPathRelationshipSerializer(LearningResourceRelationshipSerializer):
    """Specialized serializer for a LearningPath relationship"""

    relation_type = serializers.HiddenField(
        default=constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
    )


class ContentFileSerializer(serializers.ModelSerializer):
    """
    Serializer class for course run ContentFiles
    """

    run_id = serializers.IntegerField(source="run.id")
    run_readable_id = serializers.CharField(source="run.run_id")
    run_title = serializers.CharField(source="run.title")
    run_slug = serializers.CharField(source="run.slug")
    semester = serializers.CharField(source="run.semester")
    year = serializers.IntegerField(source="run.year")
    topics = LearningResourceTopicSerializer(
        source="run.learning_resource.topics", many=True
    )
    resource_id = serializers.CharField(source="run.learning_resource.id")
    departments = LearningResourceDepartmentSerializer(
        source="run.learning_resource.departments", many=True
    )
    resource_readable_id = serializers.CharField(
        source="run.learning_resource.readable_id"
    )
    course_number = serializers.SerializerMethodField()
    content_feature_type = LearningResourceContentTagField(source="content_tags")
    offered_by = LearningResourceOfferorSerializer(
        source="run.learning_resource.offered_by"
    )
    platform = LearningResourcePlatformSerializer(
        source="run.learning_resource.platform"
    )

    def get_course_number(self, instance) -> list[str]:
        """Extract the course number(s) from the associated course"""
        if hasattr(instance.run.learning_resource, LearningResourceType.course.name):
            return [
                coursenum["value"]
                for coursenum in instance.run.learning_resource.course.course_numbers
            ]
        return []

    class Meta:
        model = models.ContentFile
        fields = [
            "id",
            "run_id",
            "run_title",
            "run_slug",
            "departments",
            "semester",
            "year",
            "topics",
            "key",
            "uid",
            "title",
            "description",
            "url",
            "content_feature_type",
            "content_type",
            "content",
            "content_title",
            "content_author",
            "content_language",
            "image_src",
            "resource_id",
            "resource_readable_id",
            "course_number",
            "file_type",
            "offered_by",
            "platform",
            "run_readable_id",
        ]


class UserListSerializer(serializers.ModelSerializer, WriteableTopicsMixin):
    """
    Simplified serializer for UserList model.
    """

    item_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    def get_image(self, instance) -> dict:
        """Return the image of the first item"""
        list_item = instance.children.order_by("position").first()
        if list_item and list_item.child.image:
            return LearningResourceImageSerializer(instance=list_item.child.image).data
        return None

    def get_item_count(self, instance) -> int:
        """Return the number of items in the list"""
        return getattr(instance, "item_count", None) or instance.resources.count()

    def create(self, validated_data):
        """Create a new user list"""
        request = self.context.get("request")
        if request and hasattr(request, "user") and isinstance(request.user, User):
            validated_data["author"] = request.user
            topics_data = validated_data.pop("topics", [])
            with transaction.atomic():
                userlist = super().create(validated_data)
                userlist.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            return userlist
        return None

    def update(self, instance, validated_data):
        """Update an existing user list"""
        request = self.context.get("request")
        validated_data["author"] = request.user
        topics_data = validated_data.pop("topics", None)
        with transaction.atomic():
            userlist = super().update(instance, validated_data)
            if topics_data is not None:
                userlist.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            return userlist

    class Meta:
        model = models.UserList
        exclude = ("resources", *COMMON_IGNORED_FIELDS)
        read_only_fields = ["author"]


class UserListRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer for UserListRelationship model
    """

    resource = LearningResourceSerializer(read_only=True, source="child")

    def create(self, validated_data):
        user_list = validated_data["parent"]
        items = models.UserListRelationship.objects.filter(parent=user_list)
        position = (
            items.aggregate(Max("position"))["position__max"] or items.count()
        ) + 1
        item, _ = models.UserListRelationship.objects.get_or_create(
            parent=validated_data["parent"],
            child=validated_data["child"],
            defaults={"position": position},
        )
        return item

    def update(self, instance, validated_data):
        position = validated_data["position"]
        with transaction.atomic():
            if position > instance.position:
                # move items between old & new positions up, inclusive of new position
                models.UserListRelationship.objects.filter(
                    position__lte=position, position__gt=instance.position
                ).update(position=F("position") - 1)
            else:
                models.UserListRelationship.objects.filter(
                    position__lt=instance.position, position__gte=position
                ).update(position=F("position") + 1)
            instance.position = position
            instance.save()

        return instance

    class Meta:
        model = models.UserListRelationship
        extra_kwargs = {"position": {"required": False}}
        exclude = COMMON_IGNORED_FIELDS
