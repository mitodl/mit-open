"""Filters for testimonials."""

from django_filters import (
    FilterSet,
    ModelMultipleChoiceFilter,
    NumberFilter,
)

from channels.models import FieldChannel
from learning_resources.models import LearningResourceOfferor


class AttestationFilter(FilterSet):
    """Attestation filter"""

    channels = ModelMultipleChoiceFilter(
        label="The channels the attestation is for",
        queryset=FieldChannel.objects.all(),
    )
    offerors = ModelMultipleChoiceFilter(
        label="The offerors the attestation is for",
        queryset=LearningResourceOfferor.objects.all(),
    )
    position = NumberFilter(
        label="Only show items that exist at this position",
    )
