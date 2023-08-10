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


class LearningResourcePlatformSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceDepartment"""

    class Meta:
        model = models.LearningResourcePlatform
        fields = "__all__"


class LearningResourceDepartmentSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceDepartment"""

    class Meta:
        model = models.LearningResourceDepartment
        fields = "__all__"


class LearningResourceImageSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceImage"""

    class Meta:
        model = models.LearningResourceImage
        fields = "__all__"


class LearningResourceRunSerializer(serializers.ModelSerializer):
    """Serializer for the LearningResourceRun model"""

    class Meta:
        model = models.LearningResourceRun
        fields = "__all__"


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for the Course model"""

    class Meta:
        model = models.Course
        exclude = ("learning_resource",)


class LearningResourceBaseSerializer(serializers.ModelSerializer):
    """Serializer for LearningResource"""

    topics = LearningResourceTopicSerializer(read_only=True, many=True, allow_null=True)
    offered_by = LearningResourceOfferorField(read_only=True, allow_null=True)
    runs = LearningResourceRunSerializer(read_only=True, many=True, allow_null=True)
    image = LearningResourceImageSerializer(read_only=True, allow_null=True)

    class Meta:
        model = models.LearningResource
        fields = "__all__"


class ProgramSerializer(serializers.ModelSerializer):
    """Serializer for the Program model"""

    courses = LearningResourceBaseSerializer(many=True, allow_null=True)

    class Meta:
        model = models.Program
        fields = "__all__"


class LearningResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for LearningResource"""

    course = CourseSerializer(allow_null=True)
    program = ProgramSerializer(allow_null=True)

    class Meta:
        model = models.LearningResource
        fields = "__all__"
