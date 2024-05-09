"""Serializers for testimonials."""

from rest_framework import serializers

from testimonials.models import Attestation


class AttestationSerializer(serializers.ModelSerializer):
    """Serializer for attestations."""

    avatar = serializers.SerializerMethodField()
    avatar_small = serializers.SerializerMethodField()
    avatar_medium = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()

    def get_avatar(self, attestation) -> str | None:
        """Get the avatar image URL"""
        return attestation.avatar.url if attestation.avatar else None

    def get_avatar_small(self, attestation) -> str | None:
        """Get the avatar image small URL"""
        return attestation.avatar_small.url if attestation.avatar_small else None

    def get_avatar_medium(self, attestation) -> str | None:
        """Get the avatar image medium URL"""
        return attestation.avatar_medium.url if attestation.avatar_medium else None

    def get_cover(self, attestation) -> str | None:
        """Get the cover image URL"""
        return attestation.cover.url if attestation.cover else None

    class Meta:
        """Meta options for the serializer"""

        model = Attestation
        fields = "__all__"
