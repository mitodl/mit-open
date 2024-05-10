"""Extensions to drf-spectacular schema"""

from drf_spectacular.extensions import (
    OpenApiSerializerExtension,
    OpenApiSerializerFieldExtension,
)
from drf_spectacular.plumbing import ResolvedComponent

from channels import constants, serializers


class ChannelTypeChoiceFieldExtension(OpenApiSerializerFieldExtension):
    target_class = "channels.serializers.ChannelTypeChoiceField"

    def map_serializer_field(self, auto_schema, direction):  # noqa: ARG002
        return {"allOf": [{"$ref": "ChannelTypeEnum"}]}


class ChannelTypeConstantFieldExtension(OpenApiSerializerFieldExtension):
    target_class = "channels.serializers.ChannelTypeConstantField"

    def map_serializer_field(self, auto_schema, direction):  # noqa: ARG002
        return {
            "type": "string",
            "default": self.target.default,
            "enum": [self.target.default],
        }


class FieldChannelSerializerExtension(OpenApiSerializerExtension):
    target_class = "channels.serializers.FieldChannelSerializer"

    def _map_field_channel_base(self, auto_schema, direction):
        # this will only be generated on return of map_serializer so mock it for now
        return ResolvedComponent(
            name=auto_schema._get_serializer_name(  # noqa: SLF001
                self.target, direction
            ),
            type=ResolvedComponent.SCHEMA,
            object=self.target,
            schema=auto_schema._map_basic_serializer(  # noqa: SLF001
                serializers.FieldChannelBaseSerializer, direction
            ),
        )

    def map_serializer(self, auto_schema, direction):
        sub_serializers = serializers.FieldChannelBaseSerializer.__subclasses__()

        resolved_sub_serializers = [
            (
                sub().fields["channel_type"].default,
                auto_schema.resolve_serializer(sub, direction).ref,
            )
            for sub in sub_serializers
        ]

        # manually register this enum with the schema
        # it otherwise doesn't automatically get picked up
        # because of how ChannelTypeFieldConstant works
        channel_type_enum = ResolvedComponent(
            name="ChannelTypeEnum",
            object="ChannelTypeEnum",
            type=ResolvedComponent.SCHEMA,
            schema={
                "enum": constants.ChannelType.names(),
                "type": "string",
                "description": "\n".join(
                    [
                        f"* `{channel_type}` - {channel_type}"
                        for channel_type in constants.ChannelType.names()
                    ]
                ),
            },
        )
        auto_schema.registry.register_on_missing(channel_type_enum)

        return {
            "oneOf": [ref for (_, ref) in resolved_sub_serializers],
            "discriminator": {
                "propertyName": "channel_type",
                "mapping": {
                    name: ref["$ref"] for (name, ref) in resolved_sub_serializers
                },
            },
        }
