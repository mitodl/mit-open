"""Common DRF serializers"""

from rest_framework import serializers

COMMON_IGNORED_FIELDS = ("created_on", "updated_on")


class WriteableSerializerMethodField(serializers.SerializerMethodField):
    """
    A SerializerMethodField which has been marked as not read_only so that submitted data passed validation.
    """  # noqa: E501

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.read_only = False

    def to_internal_value(self, data):
        return data
