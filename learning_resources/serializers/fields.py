"""Fields for learning_resource serializers"""
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from learning_resources import models
from learning_resources.serializers.constants import COMMON_IGNORED_FIELDS


@extend_schema_field({"type": "string"})
class LearningResourceOfferorField(serializers.Field):
    """Serializer for LearningResourceOfferor"""

    def to_representation(self, value):
        """Serialize offered_by as the name only"""
        return value.name


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceContentTagField(serializers.Field):
    """Serializer for LearningResourceContentTag"""

    def to_representation(self, value):
        """Serializes resource_content_tags as a list of OfferedBy names"""  # noqa: E501,D401
        return [tag.name for tag in value.all()]


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceTopicsField(serializers.Field):
    """Serializer field for LearningResourceTopics"""

    def to_representation(self, value):
        """Serializes resource_content_tags as a list of OfferedBy names"""  # noqa: D401,E501
        return [topic.name for topic in value.all()]


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
