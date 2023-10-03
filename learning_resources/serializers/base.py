"""Base serializers"""
from rest_framework.serializers import ModelSerializer

from learning_resources.serializers.constants import COMMON_IGNORED_FIELDS


class BaseSerializer(ModelSerializer):
    """Base serializer for API responses"""

    class Meta:
        exclude = (*COMMON_IGNORED_FIELDS,)
        expandable_fields = {}  # nothing expandable by default


class BaseLearningResourceDetailSerializer(BaseSerializer):
    """Base serializer for learning resource detail models"""

    class Meta(BaseSerializer.Meta):
        exclude = (
            "learning_resource",
            *BaseSerializer.Meta.exclude,
        )
