"""WidgetInstnace serializer"""

from typing import Optional

from rest_framework import serializers

from main.serializers import WriteableSerializerMethodField
from widgets.models import WidgetInstance
from widgets.serializers.utils import get_widget_type_names


def _raise_not_implemented(
    *args,  # noqa: ARG001
    **kwargs,  # noqa: ARG001
):
    """Raises an error indicating this is not implemented"""  # noqa: D401
    raise NotImplementedError


class WidgetConfigSerializer(serializers.Serializer):
    """Serializer for widget configuration"""

    def get_form_spec(self):
        """Returns a specification for building/editing a widget"""  # noqa: D401
        return [field.get_field_spec() for key, field in self.fields.items()]


class WidgetInstanceSerializer(serializers.ModelSerializer):
    """WidgetInstance serializer"""

    name = None
    configuration_serializer_class = _raise_not_implemented

    widget_type = serializers.ChoiceField(choices=[])
    json = serializers.SerializerMethodField()
    configuration = WriteableSerializerMethodField()
    position = serializers.IntegerField(write_only=True)

    # this is only passed if the widget is being created
    widget_list_id = serializers.CharField(write_only=True, required=False)

    @classmethod
    def get_widget_spec(cls):
        """Returns a specification for building/editing a widget"""  # noqa: D401
        return {
            "widget_type": cls.name,
            "description": cls.description,
            "form_spec": cls.configuration_serializer_class().get_form_spec(),
        }

    def __init__(self, *args, **kwargs):
        self.fields["widget_type"].choices = get_widget_type_names()
        super().__init__(*args, **kwargs)

    def validate_configuration(self, value):
        """Returns configuration as validated by configuration_serializer_class"""  # noqa: D401

        if self.configuration_serializer_class is not _raise_not_implemented:
            serializer = self.configuration_serializer_class(data=value)
            serializer.is_valid(raise_exception=True)
            return {"configuration": serializer.data}

        # we'll end up here when WidgetListSerializer validates its widgets field
        return {"configuration": value}

    def get_configuration(self, instance) -> dict:
        """Returns the configuration to serialize"""  # noqa: D401
        return instance.configuration

    def get_json(self, instance) -> Optional[dict]:  # pylint: disable=unused-argument  # noqa: ARG002
        """Renders the widget to json based on configuration"""  # noqa: D401
        return None

    class Meta:
        model = WidgetInstance
        fields = (
            "id",
            "widget_type",
            "title",
            "configuration",
            "position",
            "widget_list_id",
            "json",
        )
        write_only = ("position", "widget_list_id")
        read_only = ("json",)
