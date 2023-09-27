"""Serializers for opensearch data"""
# pylint: disable=unused-argument,too-many-lines
import logging

from learning_resources.models import Course, Program
from learning_resources.serializers import (
    LearningResourceSerializer,
)
from learning_resources_search.api import (
    gen_course_id,
    gen_program_id,
)

log = logging.getLogger()


def serialize_bulk_courses(ids):
    """
    Serialize courses for bulk indexing

    Args:
        ids(list of int): List of course id's
    """
    for course in Course.objects.filter(learning_resource_id__in=ids):
        yield serialize_course_for_bulk(course)


def serialize_bulk_courses_for_deletion(ids):
    """
    Serialize courses for bulk deletion

    Args:
        ids(list of int): List of course id's
    """
    for course_obj in Course.objects.filter(learning_resource_id__in=ids):
        yield serialize_for_deletion(
            gen_course_id(
                course_obj.learning_resource.platform,
                course_obj.learning_resource.readable_id,
            )
        )


def serialize_course_for_bulk(course_obj):
    """
    Serialize a course for bulk API request

    Args:
        course_obj (Course): A course
    """
    return {
        "_id": gen_course_id(
            course_obj.learning_resource.platform,
            course_obj.learning_resource.readable_id,
        ),
        **LearningResourceSerializer(course_obj.learning_resource).data,
    }


def serialize_bulk_programs(ids):
    """
    Serialize programs for bulk indexing

    Args:
        ids(list of int): List of program id's
    """
    for program in Program.objects.filter(learning_resource_id__in=ids):
        yield serialize_program_for_bulk(program)


def serialize_bulk_programs_for_deletion(ids):
    """
    Serialize programs for bulk deletion

    Args:
        ids(list of int): List of program id's
    """
    for program in Program.objects.filter(learning_resource_id__in=ids):
        yield serialize_for_deletion(gen_program_id(program))


def serialize_program_for_bulk(program_obj):
    """
    Serialize a program for bulk API request

    Args:
        program_obj (Program): A program
    """
    return {
        "_id": gen_program_id(program_obj),
        **LearningResourceSerializer(program_obj.learning_resource).data,
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
