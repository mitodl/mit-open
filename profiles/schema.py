from drf_spectacular.extensions import OpenApiSerializerFieldExtension

from learning_resources.serializers import LearningResourceTopicSerializer


class InterestsFieldExtension(OpenApiSerializerFieldExtension):
    """Extension for InterestsField"""

    target_class = "profiles.serializers.TopicInterestsField"

    def map_serializer_field(self, auto_schema, direction):
        if direction == "request":
            return {
                "type": "array",
                "items": {
                    "type": "integer",
                },
            }

        return {
            "type": "array",
            "items": auto_schema.resolve_serializer(
                LearningResourceTopicSerializer, direction
            ).ref,
        }
