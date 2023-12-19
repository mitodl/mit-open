"""Filters for learning_resources API"""
import logging

from django_filters import CharFilter, ChoiceFilter, FilterSet, NumberFilter

from learning_resources.constants import (
    DEPARTMENTS,
    LEARNING_RESOURCE_SORTBY_OPTIONS,
    LearningResourceType,
    LevelType,
    OfferedBy,
    PlatformType,
)
from learning_resources.models import ContentFile, LearningResource

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
        choices=([(offeror.name, offeror.value) for offeror in OfferedBy]),
    )

    platform = ChoiceFilter(
        label="The platform on which learning resources are offered",
        method="filter_platform",
        choices=([(platform.name, platform.value) for platform in PlatformType]),
    )

    level = ChoiceFilter(
        label="The academic level of the resources",
        method="filter_level",
        choices=([(level.name, level.value) for level in LevelType]),
    )

    topic = CharFilter(
        label="Topics covered by the resources. Load the '/api/v1/topics' endpoint "
        "for a list of topics",
        field_name="topics__name",
        lookup_expr="iexact",
    )

    course_feature = CharFilter(
        label="Content feature for the resources. Load the 'api/v1/course_features' "
        "endpoint for a list of course features",
        field_name="content_tags__name",
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
        return queryset.filter(runs__level__contains=[LevelType[value].value])

    def filter_sortby(self, queryset, _, value):
        """Sort the queryset in the order specified by the value"""
        return queryset.order_by(LEARNING_RESOURCE_SORTBY_OPTIONS[value]["sort"])

    class Meta:
        model = LearningResource
        fields = ["professional"]


class ContentFileFilter(FilterSet):
    """ContentFile filter"""

    run_id = NumberFilter(
        label="The id of the learning resource run the content file belongs to",
        field_name="run_id",
        lookup_expr="exact",
    )

    learning_resource_id = NumberFilter(
        label="The id of the learning resource the content file belongs to",
        field_name="run__learning_resource_id",
        lookup_expr="exact",
    )

    content_feature_type = CharFilter(
        label="Content feature type for the content file. Load the "
        "'api/v1/course_features' endpoint for a list of course features",
        field_name="content_tags__name",
        lookup_expr="iexact",
    )

    offered_by = ChoiceFilter(
        label="The organization that offers a learning resource the content file "
        "belongs to",
        method="filter_offered_by",
        choices=([(offeror.name, offeror.value) for offeror in OfferedBy]),
    )

    platform = ChoiceFilter(
        label="The platform on which learning resources the content file belongs "
        "to is offered",
        method="filter_platform",
        choices=([(platform.name, platform.value) for platform in PlatformType]),
    )

    run_readable_id = CharFilter(
        label="The readable id of the learning resource run the content file "
        "belongs to",
        field_name="run__run_id",
        lookup_expr="exact",
    )

    learning_resource_readable_id = CharFilter(
        label="The readable id of the learning resource the content file belongs to",
        field_name="run__learning_resource__readable_id",
        lookup_expr="exact",
    )

    def filter_offered_by(self, queryset, _, value):
        """OfferedBy Filter for content files"""
        return queryset.filter(run__learning_resource__offered_by__code=value)

    def filter_platform(self, queryset, _, value):
        """Platform Filter for content files"""
        return queryset.filter(run__learning_resource__platform__code=value)

    def filter_learning_resource_types(self, queryset, _, value):
        """Level Filter for learning resources"""
        return queryset.filter(learning_resource_types__contains=[value])

    class Meta:
        model = ContentFile
        fields = []
