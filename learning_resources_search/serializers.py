"""Serializers for opensearch data"""

import logging
from collections import OrderedDict, defaultdict
from datetime import UTC, datetime
from typing import TypedDict

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import Q
from drf_spectacular.plumbing import build_choice_description_list
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.utils.urls import replace_query_param

from learning_resources.constants import (
    DEPARTMENTS,
    GROUP_STAFF_LISTS_EDITORS,
    LEARNING_MATERIAL_RESOURCE_CATEGORY,
    LEARNING_RESOURCE_SORTBY_OPTIONS,
    RESOURCE_CATEGORY_VALUES,
    CertificationType,
    LearningResourceFormat,
    LearningResourceRelationTypes,
    LearningResourceType,
    LevelType,
    OfferedBy,
    PlatformType,
)
from learning_resources.models import (
    LearningResource,
    LearningResourceRelationship,
    UserListRelationship,
)
from learning_resources.serializers import (
    ContentFileSerializer,
    CourseNumberSerializer,
    LearningResourceSerializer,
    MicroLearningPathRelationshipSerializer,
    MicroUserListRelationshipSerializer,
)
from learning_resources_search.api import gen_content_file_id
from learning_resources_search.constants import (
    CONTENT_FILE_TYPE,
)
from learning_resources_search.models import PercolateQuery
from learning_resources_search.utils import remove_child_queries
from main.serializers import (
    COMMON_IGNORED_FIELDS,
)

log = logging.getLogger()


OCW_SEMESTER_TO_MONTH_MAPPING = {
    "Fall": 9,
    "Spring": 3,
    "January IAP": 1,
    "Summer": 6,
    None: 1,
}


class SearchCourseNumberSerializer(CourseNumberSerializer):
    """Serializer for CourseNumber, including extra fields for search"""

    primary = serializers.BooleanField()
    sort_coursenum = serializers.CharField()


def get_resource_age_date(learning_resource_obj, resource_category):
    """
    Get the internal resource_age_date which measures how stale a resource is.
    Resources with upcoming runs have a resource_age_date of null. Otherwise the
    date is the last modified date for learning materials or the start date of the
    last run for courses.
    """

    resource_age_date = None

    if resource_category == LEARNING_MATERIAL_RESOURCE_CATEGORY:
        resource_age_date = learning_resource_obj.last_modified
    elif (
        learning_resource_obj.resource_type == LearningResourceType.course.name
        and not learning_resource_obj.next_start_date
    ):
        last_run = (
            learning_resource_obj.runs.filter(Q(published=True))
            .order_by("start_date")
            .last()
        )

        if last_run:
            if (
                last_run.year is not None
                and learning_resource_obj.offered_by
                and learning_resource_obj.offered_by.code == OfferedBy.ocw.name
            ):
                resource_age_date = datetime(
                    last_run.year,
                    OCW_SEMESTER_TO_MONTH_MAPPING.get(last_run.semester),
                    1,
                    0,
                    0,
                    tzinfo=UTC,
                )
            else:
                resource_age_date = last_run.start_date

    return resource_age_date


def serialize_learning_resource_for_update(
    learning_resource_obj: LearningResource,
) -> dict:
    """
    Add any special search-related fields to the serializer data here

    Args:
        learning_resource_obj(LearningResource): The learning resource object

    Returns:
        dict: The serialized and transformed resource data

    """
    serialized_data = LearningResourceSerializer(instance=learning_resource_obj).data

    if learning_resource_obj.resource_type == LearningResourceType.course.name:
        serialized_data["course"]["course_numbers"] = [
            SearchCourseNumberSerializer(instance=num).data
            for num in learning_resource_obj.course.course_numbers
        ]
    return {
        "resource_relations": {"name": "resource"},
        "created_on": learning_resource_obj.created_on,
        "is_learning_material": serialized_data["resource_category"]
        == LEARNING_MATERIAL_RESOURCE_CATEGORY,
        "resource_age_date": get_resource_age_date(
            learning_resource_obj, serialized_data["resource_category"]
        ),
        **serialized_data,
    }


def extract_values(obj, key):
    """
    Pull all values of specified key from nested JSON.

    Args:
        obj(dict): The JSON object


        key(str): The JSON key to search for and extract

    Returns:
        list of matching key values

    """
    array = []

    def extract(obj, array, key):
        """Recursively search for values of key in JSON tree."""
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k == key:
                    array.append(v)
                if isinstance(v, dict | list):
                    extract(v, array, key)
        elif isinstance(obj, list):
            for item in obj:
                extract(item, array, key)
        return array

    return extract(obj, array, key)


class ArrayWrappedBoolean(serializers.BooleanField):
    """
    Wrapper that wraps booleans in arrays so they have the same format as
    other fields when passed to execute_learn_search() by the view
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def to_representation(self, data):
        data = super().to_internal_value(data)
        if data is None:
            return data
        else:
            return [data]


class DisplayChoiceField(serializers.ChoiceField):
    def __init__(self, *args, **kwargs):
        choices = kwargs.get("choices")
        self._choices = OrderedDict(choices)
        super().__init__(*args, **kwargs)

    def to_representation(self, obj):
        """Use while retrieving value for the field."""
        return self._choices[obj]


CONTENT_FILE_SORTBY_OPTIONS = [
    "id",
    "-id",
    "resource_readable_id",
    "-resource_readable_id",
]

LEARNING_RESOURCE_AGGREGATIONS = [
    "resource_type",
    "certification",
    "certification_type",
    "offered_by",
    "platform",
    "topic",
    "department",
    "level",
    "course_feature",
    "professional",
    "free",
    "learning_format",
    "resource_category",
]

CONTENT_FILE_AGGREGATIONS = ["topic", "content_feature_type", "platform", "offered_by"]


class SearchRequestSerializer(serializers.Serializer):
    q = serializers.CharField(required=False, help_text="The search text")
    offset = serializers.IntegerField(
        required=False, help_text="The initial index from which to return the results"
    )
    limit = serializers.IntegerField(
        required=False, help_text="Number of results to return per page"
    )
    offered_by_choices = [(e.name.lower(), e.value) for e in OfferedBy]
    offered_by = serializers.ListField(
        required=False,
        child=serializers.ChoiceField(choices=offered_by_choices),
        help_text=(
            f"The organization that offers the learning resource \
            \n\n{build_choice_description_list(offered_by_choices)}"
        ),
    )
    platform_choices = [(e.name.lower(), e.value) for e in PlatformType]
    platform = serializers.ListField(
        required=False,
        child=serializers.ChoiceField(choices=platform_choices),
        help_text=(
            f"The platform on which the learning resource is offered \
            \n\n{build_choice_description_list(platform_choices)}"
        ),
    )
    topic = serializers.ListField(
        required=False,
        child=serializers.CharField(),
        help_text="The topic name. To see a list of options go to api/v1/topics/",
    )

    def validate(self, attrs):
        unknown = set(self.initial_data) - set(self.fields)
        if unknown:
            error_message = "Unknown field(s): {}".format(", ".join(unknown))
            raise ValidationError(error_message)
        return attrs


class LearningResourcesSearchRequestSerializer(SearchRequestSerializer):
    id = serializers.ListField(
        required=False,
        child=serializers.IntegerField(),
        help_text="The id value for the learning resource",
    )
    sortby = serializers.ChoiceField(
        required=False,
        choices=[
            (key, LEARNING_RESOURCE_SORTBY_OPTIONS[key]["title"])
            for key in LEARNING_RESOURCE_SORTBY_OPTIONS
        ],
        help_text="If the parameter starts with '-' the sort is in descending order",
    )
    resource_choices = [(e.name, e.value.lower()) for e in LearningResourceType]
    resource_type = serializers.ListField(
        required=False,
        child=serializers.ChoiceField(
            choices=resource_choices,
        ),
        help_text=(
            f"The type of learning resource \
            \n\n{build_choice_description_list(resource_choices)}"
        ),
    )
    free = ArrayWrappedBoolean(
        required=False,
        allow_null=True,
        default=None,
    )
    professional = ArrayWrappedBoolean(
        required=False,
        allow_null=True,
        default=None,
    )
    yearly_decay_percent = serializers.FloatField(
        max_value=10,
        min_value=0,
        required=False,
        allow_null=True,
        default=None,
        help_text=(
            "Relevance score penalty percent per year for for resources without "
            "upcoming runs. Only affects results if there is a search term."
        ),
    )

    certification = ArrayWrappedBoolean(
        required=False,
        allow_null=True,
        default=None,
        help_text="True if the learning resource offers a certificate",
    )
    certification_choices = CertificationType.as_tuple()
    certification_type = serializers.ListField(
        required=False,
        child=serializers.ChoiceField(
            choices=certification_choices,
        ),
        help_text=(
            f"The type of certificate \
            \n\n{build_choice_description_list(certification_choices)}"
        ),
    )
    department_choices = list(DEPARTMENTS.items())
    department = serializers.ListField(
        required=False,
        child=serializers.ChoiceField(choices=department_choices),
        help_text=(
            f"The department that offers the learning resource \
            \n\n{build_choice_description_list(department_choices)}"
        ),
    )

    level = serializers.ListField(
        required=False, child=serializers.ChoiceField(choices=LevelType.as_list())
    )

    course_feature = serializers.ListField(
        required=False,
        child=serializers.CharField(),
        help_text="The course feature. "
        "Possible options are at api/v1/course_features/",
    )
    aggregations = serializers.ListField(
        required=False,
        help_text="Show resource counts by category",
        child=serializers.ChoiceField(choices=LEARNING_RESOURCE_AGGREGATIONS),
    )
    learning_format_choices = LearningResourceFormat.as_list()
    learning_format = serializers.ListField(
        required=False,
        child=serializers.ChoiceField(choices=learning_format_choices),
        help_text=(
            f"The format(s) in which the learning resource is offered \
            \n\n{build_choice_description_list(learning_format_choices)}"
        ),
    )
    resource_category_choices = [
        (value, value.replace("_", " ").title()) for value in RESOURCE_CATEGORY_VALUES
    ]
    resource_category = serializers.ListField(
        required=False,
        child=serializers.ChoiceField(
            choices=resource_category_choices,
        ),
        help_text=(
            f"The category of learning resource \
            \n\n{build_choice_description_list(resource_category_choices)}"
        ),
    )


class ContentFileSearchRequestSerializer(SearchRequestSerializer):
    id = serializers.ListField(
        required=False,
        child=serializers.IntegerField(),
        help_text="The id value for the content file",
    )
    sortby = serializers.ChoiceField(
        required=False,
        choices=CONTENT_FILE_SORTBY_OPTIONS,
        help_text="if the parameter starts with '-' the sort is in descending order",
    )
    content_feature_type = serializers.ListField(
        required=False,
        child=serializers.CharField(),
        help_text="The feature type of the content file. "
        "Possible options are at api/v1/course_features/",
    )
    aggregations = serializers.ListField(
        required=False,
        help_text="Show resource counts by category",
        child=serializers.ChoiceField(choices=CONTENT_FILE_AGGREGATIONS),
    )
    run_id = serializers.ListField(
        required=False,
        child=serializers.IntegerField(),
        help_text="The id value of the run that the content file belongs to",
    )
    resource_id = serializers.ListField(
        required=False,
        child=serializers.IntegerField(),
        help_text="The id value of the parent learning resource for the content file",
    )


class AggregationValue(TypedDict):
    key: str
    doc_count: int


def _transform_aggregations(aggregations):
    def get_buckets(key, aggregation):
        if "buckets" in aggregation:
            return aggregation["buckets"]
        if key in aggregation:
            return get_buckets(key, aggregation[key])
        return []

    def format_bucket(bucket):
        """
        We want to ensure the key is a string.

        For example, for boolean indexes, the OpenSearch bucket values are of
        form
            {
                "key": 0 | 1,
                "key_as_string": "false" | "true",
                "doc_count": int
            }
        Here, we return "false" or "true" as the key.
        """
        copy = {**bucket}
        if "key_as_string" in bucket:
            copy["key"] = copy.pop("key_as_string")
        if "root" in bucket:
            root_doc_count = copy.pop("root")["doc_count"]
            copy["doc_count"] = root_doc_count
        return copy

    return {
        key: [format_bucket(b) for b in get_buckets(key, agg)]
        for key, agg in aggregations.items()
    }


def _transform_search_results_suggest(search_result):
    """
    Transform suggest results from opensearch

    Args:
        search_result (dict): The results from opensearch

    Returns:
        dict: The opensearch response dict with transformed suggestions
    """

    es_suggest = search_result.pop("suggest", {})
    if (
        search_result.get("hits", {}).get("total", {}).get("value")
        <= settings.OPENSEARCH_MAX_SUGGEST_HITS
    ):
        suggestion_dict = defaultdict(int)
        suggestions = [
            suggestion
            for suggestion_list in extract_values(es_suggest, "options")
            for suggestion in suggestion_list
            if suggestion["collate_match"] is True
        ]
        for suggestion in suggestions:
            suggestion_dict[suggestion["text"]] = (
                suggestion_dict[suggestion["text"]] + suggestion["score"]
            )
        return [
            key
            for key, value in sorted(
                suggestion_dict.items(), key=lambda item: item[1], reverse=True
            )
        ][: settings.OPENSEARCH_MAX_SUGGEST_RESULTS]
    else:
        return []


class SearchResponseMetadata(TypedDict):
    aggregations: dict[str, list[AggregationValue]]
    suggestions: list[str]


class SearchResponseSerializer(serializers.Serializer):
    count = serializers.SerializerMethodField()
    next = serializers.SerializerMethodField()
    previous = serializers.SerializerMethodField()
    results = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    def construct_pagination_url(self, instance, request, link_type="next"):
        if request:
            url = request.build_absolute_uri()
            total_record_count = self.get_count(instance)
            offset = int(request.query_params.get("offset", 0))
            limit = int(
                request.query_params.get("limit", settings.OPENSEARCH_DEFAULT_PAGE_SIZE)
            )
            url = replace_query_param(url, "limit", limit)
            if link_type == "previous":
                offset -= limit
            else:
                offset += limit
            if offset >= 0 and offset < total_record_count:
                return replace_query_param(url, "offset", offset)
        return None

    def get_next(self, instance) -> str | None:
        request = self.context.get("request")
        return self.construct_pagination_url(instance, request, link_type="next")

    def get_previous(self, instance) -> str | None:
        request = self.context.get("request")
        return self.construct_pagination_url(instance, request, link_type="previous")

    def get_count(self, instance) -> int:
        return instance.get("hits", {}).get("total", {}).get("value")

    def get_metadata(self, instance) -> SearchResponseMetadata:
        return {
            "aggregations": _transform_aggregations(instance.get("aggregations", {})),
            "suggest": _transform_search_results_suggest(instance),
        }


class PercolateQuerySerializer(serializers.ModelSerializer):
    """
    Serializer for PercolateQuery objects
    """

    source_description = serializers.ReadOnlyField()
    source_label = serializers.ReadOnlyField()

    class Meta:
        model = PercolateQuery
        exclude = (*COMMON_IGNORED_FIELDS, "users")


class LearningResourcesSearchResponseSerializer(SearchResponseSerializer):
    """
    SearchResponseSerializer with OpenAPI annotations for Learning Resources
    search
    """

    def update_path_parents(self, hits):
        """Fill in learning_path_parents for path editors"""

        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            learning_path_parents_dict = {}
            hit_ids = [hit.get("_id") for hit in hits]

            # Get learning path parents for all returned resources
            learning_path_parents = LearningResourceRelationship.objects.filter(
                child__id__in=hit_ids,
                relation_type=LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value,
            ).values("id", "child_id", "parent_id")
            for parent in learning_path_parents:
                learning_path_parents_dict.setdefault(
                    str(parent["child_id"]), []
                ).append(parent)

            for hit in hits:
                if hit["_id"] in learning_path_parents_dict:
                    hit["_source"]["learning_path_parents"] = (
                        MicroLearningPathRelationshipSerializer(
                            instance=learning_path_parents_dict[hit["_id"]], many=True
                        ).data
                    )

    def update_list_parents(self, hits, user):
        """Fill in user_list_parents for users"""
        user_list_parents_dict = {}
        hit_ids = [hit.get("_id") for hit in hits]

        # Get user_list_parents for all returned resources
        user_list_parents = UserListRelationship.objects.filter(
            parent__author=user, child_id__in=hit_ids
        ).values("id", "child_id", "parent_id")
        for parent in user_list_parents:
            user_list_parents_dict.setdefault(str(parent["child_id"]), []).append(
                parent
            )

        for hit in hits:
            if hit["_id"] in user_list_parents_dict:
                hit["_source"]["user_list_parents"] = (
                    MicroUserListRelationshipSerializer(
                        instance=user_list_parents_dict[hit["_id"]], many=True
                    ).data
                )

    @extend_schema_field(LearningResourceSerializer(many=True))
    def get_results(self, instance):
        hits = instance.get("hits", {}).get("hits", [])
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            self.update_list_parents(hits, request.user)
            if (
                request.user.is_staff
                or request.user.is_superuser
                or request.user.groups.filter(name=GROUP_STAFF_LISTS_EDITORS).first()
                is not None
            ):
                self.update_path_parents(hits)
        return (hit.get("_source") for hit in hits)


class ContentFileSearchResponseSerializer(SearchResponseSerializer):
    """
    SearchResponseSerializer with OpenAPI annotations for Content Files search
    """

    @extend_schema_field(ContentFileSerializer(many=True))
    def get_results(self, instance):
        hits = instance.get("hits", {}).get("hits", [])
        return (hit.get("_source") for hit in hits)


class PercolateQuerySubscriptionRequestSerializer(
    LearningResourcesSearchRequestSerializer
):
    """
    PercolateQuerySubscriptionRequestSerializer with
    OpenAPI annotations for Percolate Subscription requests
    """

    source_type = DisplayChoiceField(
        required=False,
        choices=[(choice, choice) for choice in PercolateQuery.SOURCE_TYPES],
        help_text="The subscription type",
        default=PercolateQuery.SEARCH_SUBSCRIPTION_TYPE,
    )

    def get_search_request_data(self):
        search_data = self.data.copy()
        if "source_type" in search_data:
            search_data.pop("source_type")
        return search_data


def serialize_content_file_for_update(content_file_obj):
    """Serialize a content file for API request"""

    return {
        "resource_relations": {
            "name": CONTENT_FILE_TYPE,
            "parent": content_file_obj.run.learning_resource_id,
        },
        **ContentFileSerializer(content_file_obj).data,
    }


def serialize_bulk_learning_resources(ids):
    """
    Serialize learning resource for bulk indexing

    Args:
        ids(list of int): List of learning_resource id's
    """
    for learning_resource in (
        LearningResource.objects.select_related(*LearningResource.related_selects)
        .prefetch_related(*LearningResource.get_prefetches())
        .filter(id__in=ids)
    ):
        yield serialize_learning_resource_for_bulk(learning_resource)


def serialize_bulk_percolators(ids):
    """
    Serialize percolators for bulk indexing

    Args:
        ids(list of int): List of percolator id's
    """
    for percolator in PercolateQuery.objects.filter(id__in=ids):
        yield serialize_percolate_query(percolator)


def serialize_percolate_query(query):
    """
    Serialize PercolateQuery for Opensearch indexing

    Args:
        query (PercolateQuery): A PercolateQuery instance

    Returns:
        dict:
            This is the query dict value with `id` set to the database id so that
            OpenSearch can update this in place.
    """
    serialized = PercolateQuerySerializer(instance=query).data
    return {
        "query": {**remove_child_queries(serialized["query"])},
        "id": serialized["id"],
    }


def serialize_percolate_query_for_update(query):
    """
    Serialize PercolateQuery for Opensearch update

    Args:
        query (PercolateQuery): A PercolateQuery instance

    Returns:
        dict:
            This is the query dict value with `_id` set to the database id so that
            OpenSearch can update this in place.
    """
    return serialize_percolate_query(query)


def serialize_bulk_learning_resources_for_deletion(ids):
    """
    Serialize learning_resource for bulk deletion

    Args:
        ids(list of int): List of learning resource id's
    """
    for learning_resource_id in ids:
        yield serialize_for_deletion(learning_resource_id)


def serialize_bulk_percolators_for_deletion(ids):
    """
    Serialize percolators for bulk deletion

    Args:
        ids(list of int): List of learning resource id's
    """
    for percolate_id in ids:
        yield serialize_for_deletion(percolate_id)


def serialize_learning_resource_for_bulk(learning_resource_obj):
    """
    Serialize a learning resource for bulk API request

    Args:
        learning_resource_obj (LearningResource): A  learning_resource object
    """
    return {
        "_id": learning_resource_obj.id,
        **serialize_learning_resource_for_update(learning_resource_obj),
    }


def serialize_for_deletion(opensearch_object_id):
    """
    Serialize content for bulk deletion API request

    Args:
        opensearch_object_id (string): OpenSearch object id

    Returns:
        dict: the object deletion data
    """
    return {"_id": opensearch_object_id, "_op_type": "delete"}


def serialize_content_file_for_bulk(content_file_obj):
    """
    Serialize a content file for bulk API request

    Args:
        content_file_obj (ContentFile): A content file for a course
    """
    return {
        "_id": gen_content_file_id(content_file_obj.id),
        **serialize_content_file_for_update(content_file_obj),
    }


def serialize_content_file_for_bulk_deletion(content_file_obj):
    """
    Serialize a content file for bulk API request

    Args:
        content_file_obj (ContentFile): A content file for a course
    """
    return serialize_for_deletion(gen_content_file_id(content_file_obj.id))
