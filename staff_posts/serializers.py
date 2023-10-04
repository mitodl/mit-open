import nh3
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from staff_posts import models


@extend_schema_field(str)
class SanitizedHtmlField(serializers.Field):
    @staticmethod
    def to_representation(value):
        return value

    def to_internal_value(self, data):
        return nh3.clean(data)


class StaffPostSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceInstructor model
    """

    html = SanitizedHtmlField()
    title = serializers.CharField(max_length=255)

    class Meta:
        model = models.StaffPost
        fields = ["html", "id", "title"]
