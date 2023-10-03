"""Serializers mixins for learning_resources"""
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from learning_resources import models
from learning_resources.serializers.fields import (
    LearningResourceTopicSerializer,
)
from open_discussions.serializers import WriteableSerializerMethodField


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
        """Returns the list of topics"""  # noqa: D401
        return [
            LearningResourceTopicSerializer(topic).data
            for topic in instance.topics.all()
        ]


class ResourceListMixin(serializers.Serializer):
    """Common fields for LearningPath and other future resource lists"""

    item_count = serializers.SerializerMethodField()

    def get_item_count(self, instance) -> int:
        """Return the number of items in the list"""
        return (
            getattr(instance, "item_count", None)
            or instance.learning_resource.children.count()
        )
