"""Filters for learning_resources API"""
import logging

from django_filters import CharFilter, ChoiceFilter, FilterSet

from learning_resources.constants import (
    DEPARTMENTS,
    LEARNING_RESOURCE_SORTBY_OPTIONS,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.models import LearningResource

log = logging.getLogger(__name__)


class LearningResourceFilter(FilterSet):
    """LearningResource filter"""

    department = ChoiceFilter(
        label="The department that offers learning resources",
        method="filter_department",
        field_name="departments__department_id",
        choices=(list(DEPARTMENTS.items())),
    )

    resource_type = ChoiceFilter(
        label="The type of learning resource",
        method="filter_resource_type",
        field_name="resource_type",
        choices=(
            [
                (resource_type.name, resource_type.value)
                for resource_type in LearningResourceType
            ]
        ),
    )
    offered_by = ChoiceFilter(
        label="The organization that offers a learning resource",
        method="filter_offered_by",
        field_name="offered_by__name",
        choices=([(offeror.name, offeror.value) for offeror in OfferedBy]),
    )

    platform = ChoiceFilter(
        label="The platform on which learning resources are offered",
        method="filter_platform",
        field_name="platform__name",
        choices=([(platform.name, platform.value) for platform in PlatformType]),
    )

    level = CharFilter(
        label="The academic level of the resources (Undergraduate, Graduate, etc)",
        field_name="runs__level",
        lookup_expr="iexact",
    )

    topic = CharFilter(
        label="Topics covered by the resources. Load the 'topics' api endpoint "
        "for a list of topics",
        field_name="topics__name",
        lookup_expr="iexact",
    )

    resource_content_tags = CharFilter(
        label="The content tags for the resources. Load the 'content_tags' endpoint "
        "for a list of tags",
        field_name="resource_content_tags__name",
        lookup_expr="iexact",
    )

    sortby = ChoiceFilter(
        label="Sort By",
        method="filter_sortby",
        choices=(
            [
                (key, value["title"])
                for key, value in LEARNING_RESOURCE_SORTBY_OPTIONS.items()
            ]
        ),
    )

    def filter_resource_type(self, queryset, _, value):
        """resource_type Filter for learning resources"""
        return queryset.filter(resource_type=value)

    def filter_offered_by(self, queryset, _, value):
        """OfferedBy Filter for learning resources"""
        return queryset.filter(offered_by__code=value)

    def filter_platform(self, queryset, _, value):
        """Platform Filter for learning resources"""
        return queryset.filter(platform__code=value)

    def filter_department(self, queryset, _, value):
        """Department ID Filter for learning resources"""
        return queryset.filter(departments__department_id=value)

    def filter_sortby(self, queryset, _, value):
        """Sort the queryset in the order specified by the value"""
        return queryset.order_by(LEARNING_RESOURCE_SORTBY_OPTIONS[value]["sort"])

    class Meta:
        model = LearningResource
        fields = ["professional"]
