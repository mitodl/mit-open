from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from articles import models
from articles.validators import clean_html


@extend_schema_field(str)
class SanitizedHtmlField(serializers.Field):
    @staticmethod
    def to_representation(value):
        return value

    def to_internal_value(self, data):
        return clean_html(data)


class ArticleSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceInstructor model
    """

    html = SanitizedHtmlField()
    title = serializers.CharField(max_length=255)

    class Meta:
        model = models.Article
        fields = ["html", "id", "title"]
