"""Serializers for testimonials."""

from rest_framework import serializers

from testimonials.models import Attestation


class AttestationSerializer(serializers.ModelSerializer):
    """Serializer for attestations."""

    avatar = serializers.URLField(source="avatar.url")
    avatar_small = serializers.URLField(source="avatar_small.url")
    avatar_medium = serializers.URLField(source="avatar_medium.url")
    cover = serializers.SerializerMethodField()

    def get_cover(self, attestation) -> str | None:
        """Get the cover image URL"""
        return attestation.cover.url if attestation.cover else None

    class Meta:
        """Meta options for the serializer"""

        model = Attestation
        fields = "__all__"
