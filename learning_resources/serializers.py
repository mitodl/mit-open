"""Serializers for learning_resources"""
from rest_framework import serializers

from learning_resources import models


class LearningResourceInstructorSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceInstructor model
    """

    class Meta:
        model = models.LearningResourceInstructor
        fields = "__all__"


class LearningResourceTopicSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceTopic model
    """

    class Meta:
        model = models.LearningResourceTopic
        fields = ["id", "name"]


class LearningResourceOfferorField(serializers.Field):
    """Serializer for LearningResourceOfferor"""

    def to_representation(self, value):
        """Serializes offered_by as a list of OfferedBy names"""
        return [offeror.name for offeror in value.all()]


class LearningResourceContentTagField(serializers.Field):
    """Serializer for LearningResourceContentTag"""

    def to_representation(self, value):
        """Serializes resource_content_tags as a list of OfferedBy names"""
        return [tag.name for tag in value.all()]


class LearningResourcePlatformSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourcePlatform"""

    class Meta:
        model = models.LearningResourcePlatform
        exclude = ["updated_on", "created_on"]


class LearningResourceDepartmentSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceDepartment"""

    class Meta:
        model = models.LearningResourceDepartment
        fields = ["department_id", "name"]


class LearningResourceImageSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceImage"""

    class Meta:
        model = models.LearningResourceImage
        exclude = ["updated_on", "created_on"]


class LearningResourceRunSerializer(serializers.ModelSerializer):
    """Serializer for the LearningResourceRun model"""

    instructors = LearningResourceInstructorSerializer(
        read_only=True, allow_null=True, many=True
    )
    image = LearningResourceImageSerializer(read_only=True, allow_null=True)

    class Meta:
        model = models.LearningResourceRun
        fields = "__all__"


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for the Course model"""

    class Meta:
        model = models.Course
        exclude = ("learning_resource",)


class LearningResourceBaseSerializer(serializers.ModelSerializer):
    """Serializer for LearningResource, minus program, course"""

    topics = LearningResourceTopicSerializer(read_only=True, many=True, allow_null=True)
    offered_by = LearningResourceOfferorField(read_only=True, allow_null=True)
    resource_content_tags = LearningResourceContentTagField(
        read_only=True, allow_null=True
    )
    image = LearningResourceImageSerializer(read_only=True, allow_null=True)
    department = LearningResourceDepartmentSerializer(read_only=True, allow_null=True)

    class Meta:
        model = models.LearningResource
        fields = "__all__"


class ProgramSerializer(serializers.ModelSerializer):
    """Serializer for the Program model"""

    courses = LearningResourceBaseSerializer(read_only=True, many=True, allow_null=True)

    class Meta:
        model = models.Program
        exclude = ("learning_resource",)


class LearningResourceSerializer(LearningResourceBaseSerializer):
    """Full serializer for LearningResource"""

    course = CourseSerializer(read_only=True, allow_null=True)
    program = ProgramSerializer(read_only=True, allow_null=True)
    runs = LearningResourceRunSerializer(read_only=True, many=True, allow_null=True)

    class Meta:
        model = models.LearningResource
        fields = "__all__"
