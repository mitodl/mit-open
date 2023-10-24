"""Serializers for learning_resources"""
import logging
from uuid import uuid4

from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from learning_resources import constants, models
from learning_resources.serializers.base import BaseSerializer
from learning_resources.serializers.fields import (
    LearningResourceTypeField,
    LearningResourceContentTagField,
    LearningResourceDepartmentSerializer,
    LearningResourceImageSerializer,
    LearningResourceOfferorField,
    LearningResourceRunSerializer,
)
from learning_resources.serializers.learning_resource_details import (
    CourseSerializer,
    LearningPathSerializer,
    PodcastEpisodeSerializer,
    PodcastSerializer,
    ProgramSerializer,
)
from learning_resources.serializers.mixins import (
    WriteableTopicsMixin,
)

log = logging.getLogger(__name__)


class MicroLearningPathRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer containing only parent and child ids for a learning path relationship
    """

    parent = serializers.ReadOnlyField(source="parent_id")
    child = serializers.ReadOnlyField(source="child_id")

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("id", "parent", "child")


class MicroUserListRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer containing only parent and child ids for a user list relationship
    """

    parent = serializers.ReadOnlyField(source="parent_id")
    child = serializers.ReadOnlyField(source="child_id")

    class Meta:
        model = models.UserListRelationship
        fields = ("id", "parent", "child")


class BaseLearningResourceSerializer(BaseSerializer, WriteableTopicsMixin):
    """Serializer for LearningResource"""

    readable_id = serializers.ReadOnlyField()
    resource_type = serializers.ReadOnlyField()
    offered_by = LearningResourceOfferorField(read_only=True, allow_null=True)
    resource_content_tags = LearningResourceContentTagField(
        read_only=True, allow_null=True
    )
    departments = LearningResourceDepartmentSerializer(read_only=True, many=True)
    audience = serializers.ReadOnlyField()
    certification = serializers.ReadOnlyField()
    prices = serializers.ReadOnlyField()
    runs = LearningResourceRunSerializer(read_only=True, many=True, allow_null=True)
    image = serializers.SerializerMethodField()
    learning_path_parents = serializers.SerializerMethodField()
    user_list_parents = serializers.SerializerMethodField()

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
                instance.parents.filter(
                    relation_type=constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
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

    class Meta(BaseSerializer.Meta):
        model = models.LearningResource
        exclude = ["resources", *BaseSerializer.Meta.exclude]
        # this is here as an allowance for this ever being needed in the future
        # as subclasses need to be aware of it
        extra_kwargs = {}


class ProgramResourceSerializer(BaseLearningResourceSerializer):
    """Serializer for program resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.program.value
    )

    program = ProgramSerializer(read_only=True, allow_null=True)


class CourseResourceSerializer(BaseLearningResourceSerializer):
    """Serializer for course resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.course.value
    )

    course = CourseSerializer(read_only=True, allow_null=True)


class LearningPathResourceSerializer(BaseLearningResourceSerializer):
    """CRUD serializer for LearningPath resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.learning_path.value
    )

    learning_path = LearningPathSerializer(read_only=True, allow_null=True)

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
            return resource

    class Meta(BaseLearningResourceSerializer.Meta):
        model = models.LearningResource
        read_only_fields = ["platform", "offered_by"]


class PodcastResourceSerializer(BaseLearningResourceSerializer):
    """Serializer for podcast resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.podcast.value
    )

    podcast = PodcastSerializer(read_only=True, allow_null=True)


class PodcastEpisodeResourceSerializer(BaseLearningResourceSerializer):
    """Serializer for podcast episode resources"""

    resource_type = LearningResourceTypeField(
        default=constants.LearningResourceType.podcast_episode.value
    )

    podcast_episode = PodcastEpisodeSerializer(read_only=True, allow_null=True)


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
        )
    }

    def to_representation(self, instance):
        """Serialize a LearningResource based on resource_type"""
        serializer_cls = self.serializer_cls_mapping[instance.resource_type]

        return serializer_cls(instance=instance).data
