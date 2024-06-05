"""Filters for testimonials."""

from django.db.models import Q
from django_filters import (
    BooleanFilter,
    FilterSet,
    ModelMultipleChoiceFilter,
)

from channels.models import FieldChannel
from learning_resources.models import LearningResourceOfferor
from main.utils import now_in_utc


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
    published = BooleanFilter(
        label="Only return published testimonials", method="filter_published"
    )

    def filter_published(self, queryset, _, value):
        """Filter only published attestations"""

        if value:
            return queryset.filter(
                Q(publish_date__isnull=True) | Q(publish_date__lte=now_in_utc())
            )

        return queryset
