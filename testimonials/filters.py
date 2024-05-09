"""Filters for testimonials."""

from django_filters import (
    FilterSet,
    ModelMultipleChoiceFilter,
)

from channels.models import FieldChannel


class AttestationFilter(FilterSet):
    """Attestation filter"""

    channels = ModelMultipleChoiceFilter(
        label="The channels the attestation is for",
        queryset=FieldChannel.objects.all(),
    )
