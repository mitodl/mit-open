"""Serializers for learning resource details"""
from drf_spectacular.helpers import lazy_serializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from learning_resources import constants, models
from learning_resources.serializers.base import BaseLearningResourceDetailSerializer
from learning_resources.serializers.mixins import ResourceListMixin


class CourseSerializer(BaseLearningResourceDetailSerializer):
    """Serializer for the Course model"""

    class Meta(BaseLearningResourceDetailSerializer.Meta):
        model = models.Course


class ProgramSerializer(BaseLearningResourceDetailSerializer):
    """Serializer for the Program model"""

    courses = serializers.SerializerMethodField()

    @extend_schema_field(
        lazy_serializer(
            "learning_resources.serializers.learning_resources.CourseResourceSerializer"
        )(many=True, allow_null=True)
    )
    def get_courses(self, obj):
        """Get the learning resource courses for a program"""
        from learning_resources.serializers.learning_resources import (
            CourseResourceSerializer,
        )

        return CourseResourceSerializer(
            [rel.child for rel in obj.courses.filter(child__published=True)], many=True
        ).data

    class Meta(BaseLearningResourceDetailSerializer.Meta):
        model = models.Program


class PodcastEpisodeSerializer(BaseLearningResourceDetailSerializer):
    """
    Serializer for PodcastEpisode
    """

    class Meta(BaseLearningResourceDetailSerializer.Meta):
        model = models.PodcastEpisode


class PodcastSerializer(BaseLearningResourceDetailSerializer):
    """
    Serializer for Podcasts
    """

    episode_count = serializers.SerializerMethodField()

    def get_episode_count(self, instance) -> int:
        """Return the number of episodes in the podcast"""
        return instance.learning_resource.children.filter(
            relation_type=constants.LearningResourceRelationTypes.PODCAST_EPISODES.value
        ).count()

    class Meta(BaseLearningResourceDetailSerializer.Meta):
        model = models.Podcast


class LearningPathSerializer(BaseLearningResourceDetailSerializer, ResourceListMixin):
    """Serializer for the LearningPath model"""

    class Meta(BaseLearningResourceDetailSerializer.Meta):
        model = models.LearningPath
