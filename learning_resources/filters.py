"""Filters for learning_resources API"""

import logging

from django.db.models import Q, QuerySet
from django_filters import (
    BaseInFilter,
    CharFilter,
    ChoiceFilter,
    FilterSet,
    MultipleChoiceFilter,
    NumberFilter,
)
from django_filters.rest_framework import DjangoFilterBackend

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


def multi_or_filter(
    queryset: QuerySet, attribute: str, values: list[str or list]
) -> QuerySet:
    """Filter attribute by value string with n comma-delimited values"""
    query_or_filters = Q()
    for query in [Q(**{attribute: value}) for value in values]:
        query_or_filters |= query
    return queryset.filter(query_or_filters)


class CharInFilter(BaseInFilter, CharFilter):
    """Filter that allows for multiple character values"""


class NumberInFilter(BaseInFilter, NumberFilter):
    """Filter that allows for multiple numeric values"""


class MultipleOptionsFilterBackend(DjangoFilterBackend):
    """
    Custom filter backend that handles multiple values for the same key
    in various formats
    """

    def get_filterset_kwargs(self, request, queryset, view):  # noqa: ARG002
        """
        Adjust the query parameters to handle multiple values for the same key,
        regardless of whether they are in the form 'key=x&key=y' or 'key=x,y'
        """
        query_params = request.query_params.copy()
        for key in query_params:
            filter_key = request.parser_context[
                "view"
            ].filterset_class.base_filters.get(key)
            if filter_key:
                values = query_params.getlist(key)
                if isinstance(filter_key, MultipleChoiceFilter):
                    split_values = [
                        value.split(",") for value in query_params.getlist(key)
                    ]
                    values = [value for val_list in split_values for value in val_list]
                    query_params.setlist(key, values)
                elif (isinstance(filter_key, CharInFilter | NumberInFilter)) and len(
                    values
                ) > 1:
                    query_params[key] = ",".join(list(values))

        return {
            "data": query_params,
            "queryset": queryset,
            "request": request,
        }


class LearningResourceFilter(FilterSet):
    """LearningResource filter"""

    department = MultipleChoiceFilter(
        label="The department that offers learning resources",
        field_name="departments__department_id",
        choices=(list(DEPARTMENTS.items())),
    )

    resource_type = MultipleChoiceFilter(
        label="The type of learning resource",
        choices=(
            [
                (resource_type.name, resource_type.value)
                for resource_type in LearningResourceType
            ]
        ),
        field_name="resource_type",
        lookup_expr="iexact",
    )
    offered_by = MultipleChoiceFilter(
        label="The organization that offers a learning resource",
        choices=([(offeror.name, offeror.value) for offeror in OfferedBy]),
        field_name="offered_by",
        lookup_expr="exact",
    )

    platform = MultipleChoiceFilter(
        label="The platform on which learning resources are offered",
        choices=([(platform.name, platform.value) for platform in PlatformType]),
        field_name="platform",
        lookup_expr="exact",
    )

    level = MultipleChoiceFilter(
        label="The academic level of the resources",
        method="filter_level",
        choices=LevelType.as_list(),
    )

    topic = CharInFilter(
        label="Topics covered by the resources. Load the '/api/v1/topics' endpoint "
        "for a list of topics",
        method="filter_topic",
    )

    course_feature = CharInFilter(
        label="Content feature for the resources. Load the 'api/v1/course_features' "
        "endpoint for a list of course features",
        method="filter_course_feature",
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

    def filter_level(self, queryset, _, value):
        """Level Filter for learning resources"""
        values = [[LevelType[val].name] for val in value]
        return multi_or_filter(queryset, "runs__level__contains", values)

    def filter_topic(self, queryset, _, value):
        """Topic Filter for learning resources"""
        return multi_or_filter(queryset, "topics__name__iexact", value)

    def filter_course_feature(self, queryset, _, value):
        """Topic Filter for learning resources"""
        return multi_or_filter(queryset, "content_tags__name__iexact", value)

    def filter_sortby(self, queryset, _, value):
        """Sort the queryset in the order specified by the value"""
        return queryset.order_by(LEARNING_RESOURCE_SORTBY_OPTIONS[value]["sort"])

    class Meta:
        model = LearningResource
        fields = ["professional"]


class ContentFileFilter(FilterSet):
    """ContentFile filter"""

    run_id = NumberInFilter(
        label="The id of the learning resource run the content file belongs to",
        method="filter_run_id",
    )

    resource_id = NumberInFilter(
        label="The id of the learning resource the content file belongs to",
        method="filter_resource_id",
    )

    content_feature_type = CharInFilter(
        label="Content feature type for the content file. Load the "
        "'api/v1/course_features' endpoint for a list of course features",
        method="filter_content_feature_type",
    )

    offered_by = MultipleChoiceFilter(
        label="The organization that offers a learning resource the content file "
        "belongs to",
        field_name="run__learning_resource__offered_by",
        lookup_expr="exact",
        choices=([(offeror.name, offeror.value) for offeror in OfferedBy]),
    )

    platform = MultipleChoiceFilter(
        label="The platform on which learning resources the content file belongs "
        "to is offered",
        field_name="run__learning_resource__platform",
        lookup_expr="exact",
        choices=([(platform.name, platform.value) for platform in PlatformType]),
    )

    def filter_run_id(self, queryset, _, value):
        """Run ID Filter for contentfiles"""
        return multi_or_filter(queryset, "run_id", value)

    def filter_resource_id(self, queryset, _, value):
        """Resource ID Filter for contentfiles"""
        return multi_or_filter(queryset, "run__learning_resource__id", value)

    def filter_run_readable_id(self, queryset, _, value):
        """Run Readable ID Filter for contentfiles"""
        return multi_or_filter(queryset, "run__run_id", value)

    def filter_resource_readable_id(self, queryset, _, value):
        """Resource Readable ID Filter for contentfiles"""
        return multi_or_filter(queryset, "run__learning_resource__readable_id", value)

    def filter_content_feature_type(self, queryset, _, value):
        """Content feature type filter for contentfiles"""
        return multi_or_filter(queryset, "content_tags__name__iexact", value)

    class Meta:
        model = ContentFile
        fields = []
