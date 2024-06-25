"""Extensions to drf-spectacular schema"""

from drf_spectacular.extensions import (
    OpenApiSerializerExtension,
    OpenApiSerializerFieldExtension,
)
from drf_spectacular.plumbing import ResolvedComponent

from channels import constants, serializers


def _create_channel_type_enum_component(prefix, channel_types, auto_schema):
    """
    Create and register a channel type enum
    """
    # manually register this enum with the schema
    # it otherwise doesn't automatically get picked up
    # because of how ChannelTypeFieldConstant works
    channel_type_enum = ResolvedComponent(
        name=f"{prefix.capitalize()}ChannelTypeEnum",
        object=f"{prefix.capitalize()}ChannelTypeEnum",
        type=ResolvedComponent.SCHEMA,
        schema={
            "enum": [name for name, _ in channel_types],
            "type": "string",
            "description": "\n".join(
                [f"* `{name}` - {value}" for name, value in channel_types]
            ),
        },
    )
    auto_schema.registry.register_on_missing(channel_type_enum)

    return channel_type_enum


class ChannelTypeChoiceFieldExtension(OpenApiSerializerFieldExtension):
    target_class = "channels.serializers.ChannelTypeChoiceField"
    priority = 100

    def map_serializer_field(self, auto_schema, direction):  # noqa: ARG002
        channel_type_enum = _create_channel_type_enum_component(
            "", constants.ChannelType.as_tuple(), auto_schema
        )

        return {
            "type": "string",
            "allOf": [channel_type_enum.ref],
        }


class ChannelTypeConstantFieldExtension(OpenApiSerializerFieldExtension):
    target_class = "channels.serializers.ChannelTypeConstantField"
    priority = 100

    def map_serializer_field(self, auto_schema, direction):  # noqa: ARG002
        channel_type = self.target.default
        channel_type_enum = _create_channel_type_enum_component(
            channel_type,
            [
                (name, value)
                for name, value in constants.ChannelType.as_tuple()
                if name == channel_type
            ],
            auto_schema,
        )

        return {
            "type": "string",
            "default": self.target.default,
            "allOf": [channel_type_enum.ref],
        }


class ChannelSerializerExtension(OpenApiSerializerExtension):
    target_class = "channels.serializers.ChannelSerializer"

    def _map_channel_base(self, auto_schema, direction):
        # this will only be generated on return of map_serializer so mock it for now
        return ResolvedComponent(
            name=auto_schema._get_serializer_name(  # noqa: SLF001
                self.target, direction
            ),
            type=ResolvedComponent.SCHEMA,
            object=self.target,
            schema=auto_schema._map_basic_serializer(  # noqa: SLF001
                serializers.ChannelBaseSerializer, direction
            ),
        )

    def map_serializer(self, auto_schema, direction):
        sub_serializers = serializers.ChannelBaseSerializer.__subclasses__()

        resolved_sub_serializers = [
            (
                sub().fields["channel_type"].default,
                auto_schema.resolve_serializer(sub, direction).ref,
            )
            for sub in sub_serializers
        ]

        return {
            "oneOf": [ref for (_, ref) in resolved_sub_serializers],
            "discriminator": {
                "propertyName": "channel_type",
                "mapping": {
                    name: ref["$ref"] for (name, ref) in resolved_sub_serializers
                },
            },
        }
