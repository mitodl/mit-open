"""Serializers for content files"""
from rest_framework import serializers

from learning_resources import models
from learning_resources.serializers.fields import (
    LearningResourceDepartmentSerializer,
    LearningResourceTopicsField,
)


class ContentFileSerializer(serializers.ModelSerializer):
    """
    Serializer class for course run ContentFiles
    """

    run_id = serializers.CharField(source="run.run_id")
    run_title = serializers.CharField(source="run.title")
    run_slug = serializers.CharField(source="run.slug")
    semester = serializers.CharField(source="run.semester")
    year = serializers.IntegerField(source="run.year")
    topics = LearningResourceTopicsField(source="run.learning_resource.topics")
    resource_id = serializers.CharField(source="run.learning_resource.id")
    departments = LearningResourceDepartmentSerializer(
        source="run.learning_resource.departments", many=True
    )
    resource_readable_id = serializers.CharField(
        source="run.learning_resource.readable_id"
    )
    resource_readable_num = serializers.CharField(
        source="run.learning_resource.resource_num"
    )
    content_category = serializers.SerializerMethodField()

    def get_content_category(self, instance):  # noqa: ARG002
        """
        Get the file type of the ContentFile. For now, just return None.
        NOTE: This function needs to be updated once OCW courses are added.
        """
        return

    class Meta:
        model = models.ContentFile
        fields = [
            "id",
            "run_id",
            "run_title",
            "run_slug",
            "departments",
            "semester",
            "year",
            "topics",
            "key",
            "uid",
            "title",
            "description",
            "url",
            "short_url",
            "section",
            "section_slug",
            "content_category",
            "content_type",
            "content",
            "content_title",
            "content_author",
            "content_language",
            "image_src",
            "resource_id",
            "resource_readable_id",
            "resource_readable_num",
            "file_type",
        ]
