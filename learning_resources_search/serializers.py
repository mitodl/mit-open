"""Serializers for opensearch data"""
# pylint: disable=unused-argument,too-many-lines
import logging
from collections import defaultdict

from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from learning_resources.constants import LearningResourceType, OfferedBy, PlatformType
from learning_resources.etl.constants import CourseNumberType
from learning_resources.models import LearningResource
from learning_resources.serializers import (
    LearningResourceSerializer,
)
from learning_resources_search.constants import AGGREGATIONS

log = logging.getLogger()


def add_extra_course_number_fields(resource_data: dict):
    """Add sortable coursenums and primary(boolean) fields to course.course_numbers"""
    if resource_data.get("course"):
        course_numbers = resource_data["course"].get("course_numbers", [])
        for coursenum_data in course_numbers:
            department_data = coursenum_data.get("department", {})
            department_num = (
                department_data.get("department_id") if department_data else None
            )
            course_num = coursenum_data.get("value")
            if (
                department_num
                and department_num[0].isdigit()
                and len(department_num) == 1
            ):
                sort_coursenum = f"0{course_num}"
            else:
                sort_coursenum = course_num
            coursenum_data["primary"] = (
                coursenum_data.get("listing_type") == CourseNumberType.primary.value
            )
            coursenum_data["sort_coursenum"] = sort_coursenum


def transform_resource_data(resource_data: dict) -> dict:
    """
    Apply transformations on the resource data

    Args:
        resource_data(dict): The resource data

    Returns:
        dict: The transformed resource data

    """
    add_extra_course_number_fields(resource_data)
    return resource_data


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
    return {
        **transform_resource_data(
            LearningResourceSerializer(learning_resource_obj).data
        ),
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


class StringArrayField(serializers.ListField):
    """
    Character separated ListField.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def to_internal_value(self, data):
        return ",".join(data)

    def to_representation(self, data):
        return data.split(",")


SORTBY_OPTIONS = [
    "id",
    "-id",
    "readable_id",
    "-readable_id",
    "last_modified",
    "-last_modified",
    "runs.start_date",
    "-runs.start_date",
]


class LearningResourcesSearchRequestSerializer(serializers.Serializer):
    q = serializers.CharField(required=False, help_text="The search text")
    offset = serializers.IntegerField(required=False)
    limit = serializers.IntegerField(required=False)
    sortby = serializers.ChoiceField(
        required=False,
        choices=SORTBY_OPTIONS,
        help_text="if the parameter starts with '-' the sort is in descending order",
    )
    resource_type = StringArrayField(
        required=False,
        child=serializers.ChoiceField(
            choices=[e.value.lower() for e in LearningResourceType]
        ),
    )
    professional = StringArrayField(
        required=False,
        child=serializers.ChoiceField(choices=["true", "false"]),
    )
    certification = StringArrayField(required=False, child=serializers.CharField())
    offered_by = StringArrayField(
        required=False,
        child=serializers.ChoiceField(choices=[e.value.lower() for e in OfferedBy]),
    )
    platform = StringArrayField(
        required=False,
        child=serializers.ChoiceField(choices=[e.value.lower() for e in PlatformType]),
    )
    topic = StringArrayField(required=False, child=serializers.CharField())
    department = StringArrayField(required=False, child=serializers.CharField())
    level = StringArrayField(required=False, child=serializers.CharField())
    resource_content_tags = StringArrayField(
        required=False, child=serializers.CharField()
    )
    aggregations = StringArrayField(
        required=False,
        child=serializers.ChoiceField(choices=AGGREGATIONS),
    )
    id = StringArrayField(required=False, child=serializers.CharField())  # noqa: A003

    def validate_resource_type(self, data):
        if data:
            for resource_type_value in data.split(","):
                if resource_type_value.lower() not in [
                    e.value.lower() for e in LearningResourceType
                ]:
                    msg = f"{resource_type_value} is not a valid option"
                    raise serializers.ValidationError(msg)

        return data

    def validate_offered_by(self, data):
        if data:
            for offered_by_value in data.split(","):
                if offered_by_value.lower() not in [e.value.lower() for e in OfferedBy]:
                    msg = f"{offered_by_value} is not a valid option"
                    raise serializers.ValidationError(msg)
        return data

    def validate_platform(self, data):
        if data:
            for platform_value in data.split(","):
                if platform_value.lower() not in [
                    e.value.lower() for e in PlatformType
                ]:
                    msg = f"{platform_value} is not a valid option"
                    raise serializers.ValidationError(msg)
        return data

    def validate_professional(self, data):
        if data:
            for professional_value in data.split(","):
                if professional_value.lower() not in ["true", "false"]:
                    msg = f"{professional_value} is not a valid option"
                    raise serializers.ValidationError(msg)
        return data

    def validate_aggregations(self, data):
        if data:
            for agg_value in data.split(","):
                if agg_value.lower() not in AGGREGATIONS:
                    msg = f"{agg_value} is not a valid option"
                    raise serializers.ValidationError(msg)
        return data


def _transform_aggregations(aggregations):
    formatted_aggregations = {}
    for key, value in aggregations.items():
        if value.get("buckets"):
            formatted_aggregations[key] = value.get("buckets")
        elif value.get(key, {}).get("buckets"):
            formatted_aggregations[key] = value.get(key, {}).get("buckets")
        else:
            formatted_aggregations[key] = value.get(key, {}).get(key, {}).get("buckets")
    return formatted_aggregations


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


class LearningResourcesSearchResponseSerializer(serializers.Serializer):
    count = serializers.SerializerMethodField()
    results = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    def get_count(self, instance) -> int:
        return instance.get("hits", {}).get("total", {}).get("value")

    @extend_schema_field(LearningResourceSerializer(many=True))
    def get_results(self, instance):
        hits = instance.get("hits", {}).get("hits", [])
        return (hit.get("_source") for hit in hits)

    @extend_schema_field({"example": {"aggregations": [{}], "suggest": ["string"]}})
    def get_metadata(self, instance):
        return {
            "aggregations": _transform_aggregations(instance.get("aggregations", {})),
            "suggest": _transform_search_results_suggest(instance),
        }


def serialize_bulk_courses(ids):
    """
    Serialize courses for bulk indexing

    Args:
        ids(list of int): List of course id's
    """
    for learning_resource in LearningResource.objects.filter(id__in=ids):
        yield serialize_course_for_bulk(learning_resource)


def serialize_bulk_courses_for_deletion(ids):
    """
    Serialize courses for bulk deletion

    Args:
        ids(list of int): List of course id's
    """
    for learning_resource_id in ids:
        yield serialize_for_deletion(learning_resource_id)


def serialize_course_for_bulk(learning_resource_obj):
    """
    Serialize a course for bulk API request

    Args:
        learning_resource_obj (LearningResource): A course learning resource
    """
    return {
        "_id": learning_resource_obj.id,
        **serialize_learning_resource_for_update(learning_resource_obj),
    }


def serialize_bulk_programs(ids):
    """
    Serialize programs for bulk indexing

    Args:
        ids(list of int): List of program id's
    """
    for learning_resource in LearningResource.objects.filter(id__in=ids):
        yield serialize_program_for_bulk(learning_resource)


def serialize_bulk_programs_for_deletion(ids):
    """
    Serialize programs for bulk deletion

    Args:
        ids(list of int): List of program id's
    """
    for learning_resource_id in ids:
        yield serialize_for_deletion(learning_resource_id)


def serialize_program_for_bulk(learning_resource_obj):
    """
    Serialize a program for bulk API request

    Args:
        learning_resource_obj (LearningResource): A program learning_resource object
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
