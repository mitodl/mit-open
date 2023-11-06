"""Indexing tasks"""

# pylint: disable=too-many-lines

import logging
from contextlib import contextmanager

import celery
from celery.exceptions import Ignore
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from opensearchpy.exceptions import NotFoundError, RequestError

from learning_resources.models import Course, LearningResource, Program
from learning_resources.utils import load_course_blocklist
from learning_resources_search import indexing_api as api
from learning_resources_search.constants import (
    COURSE_TYPE,
    PROGRAM_TYPE,
    SEARCH_CONN_EXCEPTIONS,
    IndexestoUpdate,
)
from learning_resources_search.exceptions import ReindexError, RetryError
from learning_resources_search.serializers import serialize_learning_resource_for_update
from open_discussions.celery import app
from open_discussions.utils import chunks, merge_strings

User = get_user_model()
log = logging.getLogger(__name__)


# For our tasks that attempt to partially update a document, there's a chance that
# the document has not yet been created. When we get an error that indicates that the
# document doesn't exist for the given ID, we will retry a few times in case there is
# a waiting task to create the document.
PARTIAL_UPDATE_TASK_SETTINGS = {
    "autoretry_for": (NotFoundError,),
    "retry_kwargs": {"max_retries": 5},
    "default_retry_delay": 2,
}


@app.task
def deindex_document(doc_id, object_type, **kwargs):
    """Task that makes a request to remove an ES document"""
    return api.deindex_document(doc_id, object_type, **kwargs)


@app.task(**PARTIAL_UPDATE_TASK_SETTINGS)
def upsert_course(course_id):
    """Upsert course based on stored database information"""
    course_obj = LearningResource.objects.get(id=course_id)
    course_data = serialize_learning_resource_for_update(course_obj)
    api.upsert_document(
        course_id,
        course_data,
        COURSE_TYPE,
        retry_on_conflict=settings.INDEXING_ERROR_RETRIES,
    )


@app.task(**PARTIAL_UPDATE_TASK_SETTINGS)
def upsert_program(program_id):
    """Upsert program based on stored database information"""

    program_obj = Program.objects.get(learning_resource_id=program_id)
    program_data = serialize_learning_resource_for_update(program_obj.learning_resource)
    api.upsert_document(
        program_obj.learning_resource.id,
        program_data,
        PROGRAM_TYPE,
        retry_on_conflict=settings.INDEXING_ERROR_RETRIES,
    )


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def index_courses(ids, index_types):
    """
    Index courses

    Args:
        ids(list of int): List of course id's
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated


    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.index_courses(ids, index_types)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "index_courses threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def bulk_deindex_courses(ids):
    """
    Deindex courses by a list of course.id

    Args:
        ids(list of int): List of course id's

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.deindex_courses(ids)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "bulk_deindex_courses threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def index_programs(ids, index_types):
    """
    Index programs

    Args:
        ids(list of int): List of program id's
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated


    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.index_programs(ids, index_types)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "index_programs threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def bulk_deindex_programs(ids):
    """
    Deindex programs

    Args:
        ids(list of int): List of program id's

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.deindex_programs(ids)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "bulk_deindex_programs threw an error"
        log.exception(error)
        return error


@contextmanager
def wrap_retry_exception(*exception_classes):
    """
    Wrap exceptions with RetryError so Celery can use it for autoretry

    Args:
        *exception_classes (tuple of type): Exception classes which should become
            RetryError
    """
    try:
        yield
    except Exception as ex:  # pylint:disable=bare-except
        # Celery is confused by exceptions which don't take a string as an argument,
        # so we need to wrap before raising
        if isinstance(ex, exception_classes):
            raise RetryError(str(ex)) from ex
        raise


@app.task(bind=True)
def start_recreate_index(self, indexes):
    """
    Wipe and recreate index and mapping, and index all items.
    """
    try:
        new_backing_indices = {
            obj_type: api.create_backing_index(obj_type) for obj_type in indexes
        }

        # Do the indexing on the temp index
        log.info("starting to index %s objects...", ", ".join(indexes))

        index_tasks = []

        if COURSE_TYPE in indexes:
            blocklisted_ids = load_course_blocklist()
            index_tasks = index_tasks + [
                index_courses.si(
                    ids, index_types=IndexestoUpdate.reindexing_index.value
                )
                for ids in chunks(
                    Course.objects.filter(learning_resource__published=True)
                    .exclude(learning_resource__readable_id=blocklisted_ids)
                    .order_by("learning_resource_id")
                    .values_list("learning_resource_id", flat=True),
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                )
            ]

        if PROGRAM_TYPE in indexes:
            index_tasks = index_tasks + [
                index_programs.si(
                    ids, index_types=IndexestoUpdate.reindexing_index.value
                )
                for ids in chunks(
                    Program.objects.filter(learning_resource__published=True)
                    .order_by("learning_resource_id")
                    .values_list("learning_resource_id", flat=True),
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                )
            ]

        index_tasks = celery.group(index_tasks)

    except:  # noqa: E722
        error = "start_recreate_index threw an error"
        log.exception(error)
        return error

    # Use self.replace so that code waiting on this task will also wait on the indexing
    #  and finish tasks
    raise self.replace(
        celery.chain(index_tasks, finish_recreate_index.s(new_backing_indices))
    )


@app.task(bind=True)
def start_update_index(self, indexes, platform):
    # pylint: disable=too-many-branches
    """
    Wipe and recreate index and mapping, and index all items.
    """
    try:
        log.info("starting to index %s objects...", ", ".join(indexes))

        index_tasks = []

        if COURSE_TYPE in indexes:
            blocklisted_ids = load_course_blocklist()

        if COURSE_TYPE in indexes:
            index_tasks = index_tasks + get_update_courses_tasks(
                blocklisted_ids, platform
            )

        if PROGRAM_TYPE in indexes:
            index_tasks = index_tasks + get_update_programs_tasks()

        index_tasks = celery.group(index_tasks)
    except:  # noqa: E722
        error = "start_update_index threw an error"
        log.exception(error)
        return [error]

    raise self.replace(index_tasks)


def get_update_courses_tasks(blocklisted_ids, platform):
    """
    Get list of tasks to update courses
    Args:
        blocklisted_ids(list of int): List of course id's to exclude
        platform(str): Platform filter for the task
    """

    course_update_query = (
        LearningResource.objects.filter(published=True, resource_type=COURSE_TYPE)
        .exclude(readable_id__in=blocklisted_ids)
        .order_by("id")
    )

    course_deletion_query = (
        LearningResource.objects.filter(resource_type=COURSE_TYPE)
        .filter(Q(published=False) | Q(readable_id__in=blocklisted_ids))
        .order_by("id")
    )

    if platform:
        course_update_query = course_update_query.filter(platform=platform)
        course_deletion_query = course_deletion_query.filter(platform=platform)

    index_tasks = [
        index_courses.si(ids, index_types=IndexestoUpdate.current_index.value)
        for ids in chunks(
            course_update_query.values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]

    return index_tasks + [
        bulk_deindex_courses.si(ids)
        for ids in chunks(
            course_deletion_query.values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]


def get_update_programs_tasks():
    """
    Get list of tasks to update programs
    """
    index_tasks = [
        index_programs.si(ids, index_types=IndexestoUpdate.current_index.value)
        for ids in chunks(
            LearningResource.objects.filter(published=True, resource_type=PROGRAM_TYPE)
            .order_by("id")
            .values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]

    return index_tasks + [
        bulk_deindex_programs.si(ids)
        for ids in chunks(
            LearningResource.objects.filter(published=False, resource_type=PROGRAM_TYPE)
            .order_by("id")
            .values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def finish_recreate_index(results, backing_indices):
    """
    Swap reindex backing index with default backing index

    Args:
        results (list or bool): Results saying whether the error exists
        backing_indices (dict): The backing OpenSearch indices keyed by object type
    """
    errors = merge_strings(results)
    if errors:
        try:
            api.delete_orphaned_indices()
        except RequestError as ex:
            raise RetryError(str(ex)) from ex
        msg = f"Errors occurred during recreate_index: {errors}"
        raise ReindexError(msg)

    log.info(
        "Done with temporary index. Pointing default aliases to newly created backing indexes..."  # noqa: E501
    )
    for obj_type, backing_index in backing_indices.items():
        try:
            api.switch_indices(backing_index, obj_type)
        except RequestError as ex:
            raise RetryError(str(ex)) from ex
    log.info("recreate_index has finished successfully!")
