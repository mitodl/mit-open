"""Extensions to drf-spectacular schema"""
from drf_spectacular.extensions import OpenApiSerializerFieldExtension


class LearningResourceTypeFieldConstant(OpenApiSerializerFieldExtension):
    target_class = "learning_resources.serializers.fields.LearningResourceTypeField"

    def map_serializer_field(self, auto_schema, direction):  # noqa: ARG002
        return {
            "type": "string",
            "default": self.target.default,
            "enum": [self.target.default],
        }
