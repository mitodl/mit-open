"""Extensions to drf-spectacular schema"""

from drf_spectacular.extensions import (
    OpenApiSerializerExtension,
    OpenApiSerializerFieldExtension,
)
from drf_spectacular.plumbing import ResolvedComponent

from news_events import constants, serializers


class FeedItemTypeFieldConstant(OpenApiSerializerFieldExtension):
    target_class = "news_events.serializers.FeedItemTypeField"

    def map_serializer_field(self, auto_schema, direction):  # noqa: ARG002
        return {
            "type": "string",
            "default": self.target.default,
            "enum": [self.target.default],
        }


class FeedItemSerializerExtension(OpenApiSerializerExtension):
    target_class = "news_events.serializers.FeedItemSerializer"

    def _map_feed_item_base(self, auto_schema, direction):
        # this will only be generated on return of map_serializer so mock it for now
        return ResolvedComponent(
            name=auto_schema._get_serializer_name(  # noqa: SLF001
                self.target, direction
            ),
            type=ResolvedComponent.SCHEMA,
            object=self.target,
            schema=auto_schema._map_basic_serializer(  # noqa: SLF001
                serializers.FeedItemBaseSerializer, direction
            ),
        )

    def map_serializer(self, auto_schema, direction):
        sub_serializers = serializers.FeedItemBaseSerializer.__subclasses__()

        resolved_sub_serializers = [
            (
                sub().fields["feed_type"].default,
                auto_schema.resolve_serializer(sub, direction).ref,
            )
            for sub in sub_serializers
        ]

        # manually register this enum with the schema
        # it otherwise doesn't automatically get picked up
        # because of how LearningResourceTypeFieldConstant works
        resource_type_enum = ResolvedComponent(
            name="ResourceTypeEnum",
            object="ResourceTypeEnum",
            type=ResolvedComponent.SCHEMA,
            schema={
                "enum": constants.FeedType.names(),
                "type": "string",
                "description": "\n".join(
                    [
                        f"* `{lr_type}` - {lr_type}"
                        for lr_type in constants.FeedType.names()
                    ]
                ),
            },
        )
        auto_schema.registry.register_on_missing(resource_type_enum)

        return {
            "oneOf": [ref for (_, ref) in resolved_sub_serializers],
            "discriminator": {
                "propertyName": "resource_type",
                "mapping": {
                    name: ref["$ref"] for (name, ref) in resolved_sub_serializers
                },
            },
        }
