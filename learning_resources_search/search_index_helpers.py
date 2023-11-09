"""
Functions that execute search-related asynchronous tasks
"""

import logging

from learning_resources_search import tasks
from learning_resources_search.constants import (
    COURSE_TYPE,
    PROGRAM_TYPE,
)
from learning_resources_search.tasks import deindex_document

log = logging.getLogger()


def try_with_retry_as_task(function, *args):
    """
    Try running the task, if it errors, run it as a celery task.
    """
    try:
        function(*args)
    except Exception:  # noqa: BLE001
        function.delay(*args)


def upsert_course(course_id):
    """
    Run a task to create or update a course's OpenSearch document

    Args:
        course_id (int): the primary key for the Learning_Resource to update
    """
    try_with_retry_as_task(tasks.upsert_course, course_id)


def deindex_course(learning_resource_obj):
    """
    Run a task to delete an ES Course document

    Args:
        learning_resource_obj (learning_resources.models.LearningResource): A
            LearningResource object of resource_type Course
    """
    try_with_retry_as_task(
        deindex_document,
        learning_resource_obj.id,
        COURSE_TYPE,
    )

    for run_id in learning_resource_obj.runs.values_list("id", flat=True):
        deindex_run_content_files(run_id, unpublished_only=False)


def upsert_program(learning_resource_id):
    """
    Run a task to create or update a program OpenSearch document

    Args:
        learning_resource_id (int): the primary key for the LearningResource to
        update in ES
    """
    try_with_retry_as_task(tasks.upsert_program, learning_resource_id)


def deindex_program(learning_resource_obj):
    """
    Run a task to delete an ES Program document

    Args:
        learning_resource_obj (learning_resource.models.LearningResource): A
            LearningResource object with resource_type Program
    """
    try_with_retry_as_task(deindex_document, learning_resource_obj.id, PROGRAM_TYPE)


def upsert_content_file(content_file_id):
    """
    Run a task to create or update a content file's OpenSearch document

    Args:
        content_file_id (int): the primary key for the ContentFile to update
    """
    try_with_retry_as_task(tasks.upsert_content_file, content_file_id)


def index_run_content_files(run_id):
    """
    Run a task to index content files for a LearningResourceRun

    Args:
        run_id(int): LearningResourceRun id

    """
    try_with_retry_as_task(tasks.index_run_content_files, run_id)


def deindex_run_content_files(run_id, unpublished_only):
    """
    Run a task to delete content files for a LearningResourceRun from the index

    Args:
        run_id(int): LearningResourceRun id

    """
    try_with_retry_as_task(tasks.deindex_run_content_files, run_id, unpublished_only)
