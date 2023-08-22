"""Serializers for learning_resources"""
import logging

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F, Max
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from learning_resources import models
from learning_resources.constants import LearningResourceType
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
        """Serializes offered_by as a list of OfferedBy names"""
        return [offeror.name for offeror in value.all()]


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceContentTagField(serializers.Field):
    """Serializer for LearningResourceContentTag"""

    def to_representation(self, value):
        """Serializes resource_content_tags as a list of OfferedBy names"""
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


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for the Course model"""

    class Meta:
        model = models.Course
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class ProgramSerializer(serializers.ModelSerializer):
    """Serializer for the Program model"""

    class Meta:
        model = models.Program
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class ResourceListMixin(serializers.Serializer):
    """Common fields for staff and user lists"""

    item_count = serializers.SerializerMethodField()

    def get_item_count(self, instance) -> int:
        """Return the number of items in the list"""
        return (
            getattr(instance, "item_count", None)
            or instance.learning_resource.children.count()
        )


class LearningPathSerializer(serializers.ModelSerializer, ResourceListMixin):
    """Serializer for the LearningPath model"""

    class Meta:
        model = models.LearningPath
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class LearningResourceSerializer(serializers.ModelSerializer):
    """Serializer for LearningResource, minus program, course"""

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
    program = ProgramSerializer(read_only=True, allow_null=True)
    learning_path = LearningPathSerializer(read_only=True, allow_null=True)
    runs = LearningResourceRunSerializer(read_only=True, many=True, allow_null=True)

    def validate_topics(self, topics):
        """Validator for topics"""
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
                raise ValidationError("Topic ids must be integers")
            missing = set(topics).difference(valid_topic_ids)
            if missing:
                raise ValidationError(f"Invalid topic ids: {missing}")
        return {"topics": topics}

    @extend_schema_field(LearningResourceTopicSerializer(many=True, allow_null=True))
    def get_topics(self, instance):
        """Returns the list of topics"""
        return [
            LearningResourceTopicSerializer(topic).data
            for topic in instance.topics.all()
        ]

    class Meta:
        model = models.LearningResource
        exclude = ["resources", *COMMON_IGNORED_FIELDS]


class LearningResourceRelationshipChildField(serializers.ModelSerializer):
    """Serializer for the LearningResourceRelationship model"""

    def to_representation(self, instance):
        """Serializes child as a LearningResource"""
        return LearningResourceSerializer(instance=instance.child).data

    class Meta:
        model = models.LearningResourceRelationship
        exclude = ("parent", *COMMON_IGNORED_FIELDS)


class LearningPathResourceSerializer(LearningResourceSerializer):
    """Serlializer for LearningResource of type LearningPath"""

    def validate_resource_type(self, value):
        """Only allow LearningPath resources to be CRUDed"""
        if value != LearningResourceType.learning_path.value:
            raise serializers.ValidationError(
                "Only LearningPath resources are editable"
            )
        return value

    def create(self, validated_data):
        """Ensure that the LearningPath is created by the requesting user; set topics & readable_id"""
        request = self.context.get("request")
        if request and hasattr(request, "user") and isinstance(request.user, User):
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
        request = self.context.get("request")
        if request and hasattr(request, "user") and isinstance(request.user, User):
            topics_data = validated_data.pop("topics", None)
            with transaction.atomic():
                resource = super().update(instance, validated_data)
                if topics_data is not None:
                    resource.topics.set(
                        LearningResourceTopic.objects.filter(id__in=topics_data)
                    )
                # Uncomment when search indexing is ready
                # if (
                #     instance.items.exists()
                #     and instance.published
                # ):
                #     upsert_staff_list(stafflist.id)
                # else:
                #     deindex_staff_list(stafflist)
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


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceChildField(serializers.Field):
    """Serializer for displaying child resources without other relationship info"""

    def to_representation(self, value):
        """Serializes offered_by as a list of OfferedBy names"""
        return [
            LearningResourceSerializer(relationship.child)
            for relationship in value.all()
        ]


class LearningResourceChildSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceRelationship children"""

    def to_representation(self, instance):
        """Serializes offered_by as a list of OfferedBy names"""
        return LearningResourceSerializer(instance.child).data

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("child",)


class LearningResourceRelationshipSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceRelationship"""

    resource = LearningResourceSerializer(
        read_only=True, allow_null=True, source="child"
    )

    def create(self, validated_data):
        resource = validated_data["parent"]
        items = models.LearningResourceRelationship.objects.filter(parent=resource)
        position = (
            items.aggregate(Max("position"))["position__max"] or items.count()
        ) + 1
        item, _ = models.LearningResourceRelationship.objects.get_or_create(
            parent=validated_data["parent"],
            child=validated_data["child"],
            defaults={"position": position},
        )
        # self.update_index(item.staff_list)
        return item

    def update(self, instance, validated_data):
        position = validated_data["position"]
        # to perform an update on position we atomically:
        # 1) move everything between the old position and the new position towards the old position by 1
        # 2) move the item into its new position
        # this operation gets slower the further the item is moved, but it is sufficient for now
        with transaction.atomic():
            path_items = models.LearningResourceRelationship.objects.filter(
                parent=instance.parent
            )
            if position > instance.position:
                # move items between the old and new positions up, inclusive of the new position
                path_items.filter(
                    position__lte=position, position__gt=instance.position
                ).update(position=F("position") - 1)
            else:
                # move items between the old and new positions down, inclusive of the new position
                path_items.filter(
                    position__lt=instance.position, position__gte=position
                ).update(position=F("position") + 1)
            # now move the item into place
            instance.position = position
            instance.save()
            # self.update_index(instance.staff_list)

        return instance

    class Meta:
        model = models.LearningResourceRelationship
        extra_kwargs = {"position": {"required": False}}
        exclude = COMMON_IGNORED_FIELDS
