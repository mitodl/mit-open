"""Serializers for learning_resources"""
import logging

from django.db import transaction
from django.db.models import F, Max
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from learning_resources import models
from learning_resources.constants import (
    GROUP_STAFF_LISTS_EDITORS,
    LearningResourceRelationTypes,
    LearningResourceType,
)
from learning_resources.models import LearningPath, LearningResourceTopic
from open_discussions.serializers import WriteableSerializerMethodField

COMMON_IGNORED_FIELDS = ("created_on", "updated_on")

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

    class Meta:
        model = models.LearningResourceTopic
        fields = ["id", "name"]


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceOfferorField(serializers.Field):
    """Serializer for LearningResourceOfferor"""

    def to_representation(self, value):
        """Serializes offered_by as a list of OfferedBy names"""  # noqa: D401
        return [offeror.name for offeror in value.all()]


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceContentTagField(serializers.Field):
    """Serializer for LearningResourceContentTag"""

    def to_representation(self, value):
        """Serializes resource_content_tags as a list of OfferedBy names"""  # noqa: D401, E501
        return [tag.name for tag in value.all()]


class LearningResourcePlatformSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourcePlatform"""

    class Meta:
        model = models.LearningResourcePlatform
        exclude = COMMON_IGNORED_FIELDS


class LearningResourceDepartmentSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceDepartment"""

    class Meta:
        model = models.LearningResourceDepartment
        fields = ["department_id", "name"]


class LearningResourceImageSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceImage"""

    class Meta:
        model = models.LearningResourceImage
        exclude = COMMON_IGNORED_FIELDS


class LearningResourceRunSerializer(serializers.ModelSerializer):
    """Serializer for the LearningResourceRun model"""

    instructors = LearningResourceInstructorSerializer(
        read_only=True, allow_null=True, many=True
    )
    image = LearningResourceImageSerializer(read_only=True, allow_null=True)

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


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for the Course model"""

    class Meta:
        model = models.Course
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class LearningPathSerializer(serializers.ModelSerializer, ResourceListMixin):
    """Serializer for the LearningPath model"""

    class Meta:
        model = models.LearningPath
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class MicroRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer containing only the parent and child ids
    """

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("id", "parent_id", "child_id")


class LearningResourceBaseSerializer(serializers.ModelSerializer):
    """Serializer for LearningResource, minus program"""

    offered_by = LearningResourceOfferorField(read_only=True, allow_null=True)
    resource_content_tags = LearningResourceContentTagField(
        read_only=True, allow_null=True
    )
    image = LearningResourceImageSerializer(read_only=True, allow_null=True)
    department = LearningResourceDepartmentSerializer(read_only=True, allow_null=True)
    audience = serializers.ReadOnlyField()
    certification = serializers.ReadOnlyField()
    prices = serializers.ReadOnlyField()
    topics = WriteableSerializerMethodField()
    course = CourseSerializer(read_only=True, allow_null=True)
    learning_path = LearningPathSerializer(read_only=True, allow_null=True)
    runs = LearningResourceRunSerializer(read_only=True, many=True, allow_null=True)
    learning_path_parents = serializers.SerializerMethodField()

    @extend_schema_field(MicroRelationshipSerializer(many=True, allow_null=True))
    def get_learning_path_parents(self, instance):
        """Returns the list of learning paths that the resource is in, if the user has permission"""  # noqa: D401, E501
        request = self.context.get("request")
        user = request.user if request else None
        if (
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.is_superuser
                or user.groups.filter(name=GROUP_STAFF_LISTS_EDITORS).first()
                is not None
            )
        ):
            return MicroRelationshipSerializer(
                instance.parents.filter(
                    relation_type=LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
                ),
                many=True,
            ).data
        return []

    def validate_topics(self, topics):
        """Validator for topics"""  # noqa: D401
        if len(topics) > 0:
            if isinstance(topics[0], dict):
                topics = [topic["id"] for topic in topics]
            try:
                valid_topic_ids = set(
                    LearningResourceTopic.objects.filter(id__in=topics).values_list(
                        "id", flat=True
                    )
                )
            except ValueError:
                msg = "Topic ids must be integers"
                raise ValidationError(msg)  # noqa: B904, TRY200
            missing = set(topics).difference(valid_topic_ids)
            if missing:
                msg = f"Invalid topic ids: {missing}"
                raise ValidationError(msg)
        return {"topics": topics}

    @extend_schema_field(LearningResourceTopicSerializer(many=True, allow_null=True))
    def get_topics(self, instance):
        """Returns the list of topics"""  # noqa: D401
        return [
            LearningResourceTopicSerializer(topic).data
            for topic in instance.topics.all()
        ]

    class Meta:
        model = models.LearningResource
        exclude = ["resources", *COMMON_IGNORED_FIELDS]


class ProgramSerializer(serializers.ModelSerializer):
    """Serializer for the Program model"""

    courses = serializers.SerializerMethodField()

    @extend_schema_field(LearningResourceBaseSerializer(many=True, allow_null=True))
    def get_courses(self, obj):
        """Get the learning resource courses for a program"""
        return LearningResourceRelationshipChildField(
            obj.learning_resource.children.all(), many=True
        ).data

    class Meta:
        model = models.Program
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class LearningResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for LearningResource, with program included"""

    program = ProgramSerializer(read_only=True, allow_null=True)


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


class LearningPathResourceSerializer(LearningResourceSerializer):
    """CRUD serializer for LearningPath resources"""

    def validate_resource_type(self, value):
        """Only allow LearningPath resources to be CRUDed"""
        if value != LearningResourceType.learning_path.value:
            msg = "Only LearningPath resources are editable"
            raise serializers.ValidationError(msg)
        return value

    def create(self, validated_data):
        """Ensure that the LearningPath is created by the requesting user; set topics"""
        request = self.context.get("request")
        topics_data = validated_data.pop("topics", [])
        with transaction.atomic():
            path_resource = super().create(validated_data)
            path_resource.topics.set(
                LearningResourceTopic.objects.filter(id__in=topics_data)
            )
            LearningPath.objects.create(
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
                    LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            # Uncomment when search indexing is ready
            # if (
            #     and instance.published
            # ):
            return resource

    class Meta:
        model = models.LearningResource
        fields = (
            "id",
            "title",
            "description",
            "readable_id",
            "topics",
            "resource_type",
            "learning_path",
            "published",
        )


class LearningResourceChildSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceRelationship children"""

    def to_representation(self, instance):
        """Serializes offered_by as a list of OfferedBy names"""  # noqa: D401
        return LearningResourceSerializer(instance.child).data

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("child",)


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
        default=LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
    )
