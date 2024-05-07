"""Personalization serializers"""


from rest_framework import serializers

from personalization.models import Personalization


class PersonalizationSerializer(serializers.ModelSerializer):
    """Serializer for Personalization"""

    class Meta:
        model = Personalization
        fields = "__all__"
