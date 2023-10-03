"""Course Catalog Filters for API"""
from django_filters import ChoiceFilter, FilterSet

from learning_resources.constants import (
    OPEN,
    PROFESSIONAL,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.models import LearningResource


class LearningResourceFilter(FilterSet):
    """LearningResource filter"""

    audience = ChoiceFilter(
        label="Audience",
        method="filter_audience",
        field_name="platform__audience",
        choices=(("professional", PROFESSIONAL), ("open", OPEN)),
    )
    resource_type = ChoiceFilter(
        label="Resource Type",
        method="filter_resource_type",
        field_name="resource_type",
        choices=(
            [
                (resource_type.value, resource_type.value)
                for resource_type in LearningResourceType
            ]
        ),
    )
    offered_by = ChoiceFilter(
        label="Offered By",
        method="filter_offered_by",
        field_name="offered_by__name",
        choices=([(offeror.name, offeror.value) for offeror in OfferedBy]),
    )

    platform = ChoiceFilter(
        label="Platform",
        method="filter_platform",
        field_name="platform__name",
        choices=([(platform.value, platform.value) for platform in PlatformType]),
    )

    def filter_resource_type(self, queryset, _, value):
        """resource_type Filter for learning resources"""
        return queryset.filter(resource_type=value)

    def filter_offered_by(self, queryset, _, value):
        """OfferedBy Filter for learning resources"""
        return queryset.filter(offered_by__name__contains=OfferedBy[value].value)

    def filter_audience(self, queryset, _, value):
        """Audience filter for learning resources"""
        if value == "professional":
            queryset = queryset.filter(platform__audience=PROFESSIONAL)
        else:
            queryset = queryset.exclude(platform__audience=PROFESSIONAL)
        return queryset

    def filter_platform(self, queryset, _, value):
        """Platform Filter for learning resources"""
        return queryset.filter(platform__platform=value)

    class Meta:
        model = LearningResource
        fields = [
            "platform__audience",
            "platform__platform",
            "offered_by__name",
            "resource_type",
        ]
