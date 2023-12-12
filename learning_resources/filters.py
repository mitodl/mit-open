"""Filters for learning_resources API"""
import logging

from django.db.models import Q
from django_filters import CharFilter, ChoiceFilter, FilterSet

from learning_resources.constants import (
    LEARNING_RESOURCE_SORTBY_OPTIONS,
    LearningResourceType,
    LevelType,
)
from learning_resources.models import (
    LearningResource,
)

log = logging.getLogger(__name__)


class LearningResourceFilter(FilterSet):
    """LearningResource filter"""

    department = CharFilter(
        label="The department that offers learning resources",
        method="filter_department",
        field_name="departments__department_id",
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
    offered_by = CharFilter(
        label="The organization that offers a learning resource",
        method="filter_offered_by",
        field_name="offered_by__name",
    )

    platform = CharFilter(
        label="The platform on which learning resources are offered",
        method="filter_platform",
        field_name="platform__name",
    )

    level = ChoiceFilter(
        label="The academic level of the resources",
        method="filter_level",
        choices=([(level.name, level.value) for level in LevelType]),
    )

    topic = CharFilter(
        label="Topics covered by learning resources",
        field_name="topics__name",
        lookup_expr="iexact",
    )

    resource_content_tags = CharFilter(
        label="Content tags for the learning resources",
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

    def filter_level(self, queryset, _, value):
        """Level Filter for learning resources"""
        return queryset.filter(
            Q(runs__level__contains=[value]) | Q(runs__level__contains=[value.title()])
        )

    def filter_topic(self, queryset, _, value):
        """LearningResourceTopic Filter for learning resources"""
        return queryset.filter(topics__name__iexact=value)

    def filter_tag(self, queryset, _, value):
        """LearningResourceContentTag Filter for learning resources"""
        return queryset.filter(learning_resource_tags__iexact=value)

    def filter_sortby(self, queryset, _, value):
        """Sort the queryset in the order specified by the value"""
        return queryset.order_by(LEARNING_RESOURCE_SORTBY_OPTIONS[value]["sort"])

    class Meta:
        model = LearningResource
        fields = ["professional"]
