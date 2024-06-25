"""Indexing tasks"""

import datetime
import itertools
import logging
from collections import OrderedDict
from contextlib import contextmanager
from urllib.parse import urlencode

import celery
from celery.exceptions import Ignore
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from opensearchpy.exceptions import NotFoundError, RequestError

from learning_resources.etl.constants import RESOURCE_FILE_ETL_SOURCES
from learning_resources.models import (
    ContentFile,
    Course,
    LearningResource,
    LearningResourceDepartment,
    LearningResourceOfferor,
)
from learning_resources.utils import load_course_blocklist
from learning_resources_search import indexing_api as api
from learning_resources_search.api import (
    gen_content_file_id,
    percolate_matches_for_document,
)
from learning_resources_search.constants import (
    CONTENT_FILE_TYPE,
    COURSE_TYPE,
    LEARNING_PATH_TYPE,
    PERCOLATE_INDEX_TYPE,
    PODCAST_EPISODE_TYPE,
    PODCAST_TYPE,
    PROGRAM_TYPE,
    SEARCH_CONN_EXCEPTIONS,
    VIDEO_PLAYLIST_TYPE,
    VIDEO_TYPE,
    IndexestoUpdate,
)
from learning_resources_search.exceptions import ReindexError, RetryError
from learning_resources_search.models import PercolateQuery
from learning_resources_search.serializers import (
    serialize_bulk_percolators,
    serialize_content_file_for_update,
    serialize_learning_resource_for_update,
    serialize_percolate_query_for_update,
)
from main.celery import app
from main.utils import chunks, merge_strings, now_in_utc
from profiles.utils import send_template_email

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


@app.task(**PARTIAL_UPDATE_TASK_SETTINGS)
def upsert_content_file(file_id):
    """Upsert content file based on stored database information"""

    content_file_obj = ContentFile.objects.get(id=file_id)
    content_file_data = serialize_content_file_for_update(content_file_obj)
    api.upsert_document(
        gen_content_file_id(content_file_obj.id),
        content_file_data,
        COURSE_TYPE,
        retry_on_conflict=settings.INDEXING_ERROR_RETRIES,
        routing=content_file_obj.run.learning_resource_id,
    )


@app.task
def upsert_percolate_query(percolate_id):
    """Task that makes a request to add an ES document"""
    percolate_query = PercolateQuery.objects.get(id=percolate_id)
    serialized = serialize_percolate_query_for_update(percolate_query)
    api.upsert_document(
        percolate_id,
        serialized,
        PERCOLATE_INDEX_TYPE,
        retry_on_conflict=settings.INDEXING_ERROR_RETRIES,
    )


@app.task
def deindex_document(doc_id, object_type, **kwargs):
    """Task that makes a request to remove an ES document"""
    return api.deindex_document(doc_id, object_type, **kwargs)


@app.task(**PARTIAL_UPDATE_TASK_SETTINGS)
def upsert_learning_resource(learning_resource_id):
    """Upsert learning resource based on stored database information"""
    resource_obj = LearningResource.objects.get(id=learning_resource_id)
    resource_data = serialize_learning_resource_for_update(resource_obj)
    api.upsert_document(
        learning_resource_id,
        resource_data,
        resource_obj.resource_type,
        retry_on_conflict=settings.INDEXING_ERROR_RETRIES,
    )


def _infer_percolate_group(percolate_query):
    """
    Infer the heading name for the percolate query to be
    grouped under in the email
    """
    group_keys = ["department", "topic", "offered_by"]
    original_query = OrderedDict(percolate_query.original_query)
    for key, val in original_query.items():
        if key in group_keys and val:
            if key == "department":
                return LearningResourceDepartment.objects.get(department_id=val[0]).name
            elif key == "offered_by":
                return LearningResourceOfferor.objects.get(code=val[0]).name
            return val[0]
    return None


def _infer_search_url(percolate_query):
    """
    Infer the search URL for the percolate query
    """
    original_query = OrderedDict(percolate_query.original_query)
    query_string_params = {k: v for k, v in original_query.items() if v}
    if "endpoint" in query_string_params:
        query_string_params.pop("endpoint")
    query_string = urlencode(query_string_params, doseq=True)
    return f"{settings.SITE_BASE_URL}/search?{query_string}"


def _group_percolated_rows(rows):
    def key_func(x):
        return (x["user_id"], x["group"])

    grouped_data = {}
    for key, group in itertools.groupby(rows, key_func):
        context = list(group)
        user_id = key[0]
        group_name = key[1]
        if key[0] not in grouped_data:
            grouped_data[user_id] = {group_name: []}
        if group_name not in grouped_data[user_id]:
            grouped_data[user_id][group_name] = []
        for ctx in context:
            if ctx["user_id"] == user_id:
                grouped_data[user_id][group_name].append(ctx)
    return grouped_data


def _get_percolated_rows(resources, subscription_type):
    """
    Get percolated rows for a list of learning resources and subscription type
    """
    rows = []
    all_users = set()
    # percolate each new learning resource to get matching queries
    for resource in resources:
        percolated = percolate_matches_for_document(resource.id).filter(
            source_type=subscription_type
        )
        if percolated.count() > 0:
            percolated_users = set(percolated.values_list("users", flat=True))
            all_users.update(percolated_users)
            query = percolated.first()
            rows.extend(
                [
                    {
                        "resource_url": resource.url,
                        "resource_title": resource.title,
                        "user_id": user,
                        "group": _infer_percolate_group(query),
                        "search_url": _infer_search_url(query),
                    }
                    for user in percolated_users
                ]
            )

    return rows


@app.task(bind=True)
def send_subscription_emails(self, subscription_type, period="daily"):
    """
    Send subscription emails by percolating matched documents
    """
    log.info("Sending %s subscription emails for %s", period, subscription_type)
    delta = datetime.timedelta(days=1)
    if period == "weekly":
        delta = datetime.timedelta(days=7)
    since = now_in_utc() - delta
    new_learning_resources = LearningResource.objects.filter(
        published=True, created_on__gt=since
    )
    rows = _get_percolated_rows(new_learning_resources, subscription_type)
    template_data = _group_percolated_rows(rows)

    email_tasks = celery.group(
        [
            attempt_send_digest_email_batch.si(user_template_items)
            for user_template_items in chunks(
                template_data.items(),
                chunk_size=settings.NOTIFICATION_ATTEMPT_CHUNK_SIZE,
            )
        ]
    )
    raise self.replace(email_tasks)


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def index_learning_resources(ids, resource_type, index_types):
    """
    Index courses

    Args:
        ids(list of int): List of course id's
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated
        resource_type (string): resource_type value for the learning resource objects

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.index_learning_resources(ids, resource_type, index_types)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "index_courses threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def percolate_learning_resource(resource_id):
    """
    Task that percolates a document following an index operation
    """
    log.info("percolating document %s", resource_id)
    percolate_matches_for_document(resource_id)


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def bulk_deindex_learning_resources(ids, resource_type):
    """
    Deindex learning resourse by a list of ids

    Args:
        ids(list of int): List of learning resource ids
        resource_type: the resource type

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.deindex_learning_resources(ids, resource_type)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "bulk_deindex_learning_resources threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def bulk_deindex_percolators(ids):
    """
    Deindex percolators by a list of ids

    Args:
        ids(list of int): List of percolator ids

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.deindex_percolators(ids)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "bulk_deindex_percolators threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def bulk_index_percolate_queries(percolate_ids, index_types):
    """
    Bulk index percolate queries for provided percolate query Ids

    Args:
        percolate_ids (list of int): List of percolator ids
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated
    """
    try:
        percolates = PercolateQuery.objects.filter(id__in=percolate_ids)
        log.info("Indexing %d percolator queries...", percolates.count())
        api.index_items(
            serialize_bulk_percolators(percolate_ids),
            PERCOLATE_INDEX_TYPE,
            index_types,
        )
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "bulk_index_percolate_queries threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def index_course_content_files(course_ids, index_types):
    """
    Index content files for a list of course ids

    Args:
        course_ids(list of int): List of course id's
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated


    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.index_course_content_files(course_ids, index_types=index_types)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "index_course_content_files threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def index_content_files(
    content_file_ids,
    learning_resource_id,
    index_types=IndexestoUpdate.all_indexes.value,
):
    """
    Index a list of content files

    Args:
        content_file_ids(array of int): List of content file ids
        learning_resource_id(int): Learning resource id of the content files
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.index_content_files(
                content_file_ids, learning_resource_id, index_types=index_types
            )
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "index_content_files threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def deindex_content_files(content_file_ids, learning_resource_id):
    """
    Deindex a list of content files

    Args:
        content_file_ids(array of int): List of content file ids
        learning_resource_id(int): Learning resource id of the content files

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.deindex_content_files(content_file_ids, learning_resource_id)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "deindex_content_files threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def index_run_content_files(run_id, index_types=IndexestoUpdate.all_indexes.value):
    """
    Index content files for a LearningResourceRun

    Args:
        run_id(int): LearningResourceRun id
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.index_run_content_files(run_id, index_types=index_types)
            api.deindex_run_content_files(run_id, unpublished_only=True)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "index_run_content_files threw an error"
        log.exception(error)
        return error


@app.task(autoretry_for=(RetryError,), retry_backoff=True, rate_limit="600/m")
def deindex_run_content_files(run_id, unpublished_only):
    """
    Deindex content files for a LearningResourceRun

    Args:
        run_id(int): LearningResourceRun id
        unpublished_only(bool): Whether to only deindex unpublished content files

    """
    try:
        with wrap_retry_exception(*SEARCH_CONN_EXCEPTIONS):
            api.deindex_run_content_files(run_id, unpublished_only=unpublished_only)
    except (RetryError, Ignore):
        raise
    except:  # noqa: E722
        error = "deindex_run_content_files threw an error"
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
    except Exception as ex:
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

        if PERCOLATE_INDEX_TYPE in indexes:
            index_tasks = index_tasks + [
                bulk_index_percolate_queries.si(
                    percolate_ids, IndexestoUpdate.reindexing_index.value
                )
                for percolate_ids in chunks(
                    PercolateQuery.objects.order_by("id").values_list("id", flat=True),
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                )
            ]

        if COURSE_TYPE in indexes:
            blocklisted_ids = load_course_blocklist()
            index_tasks = index_tasks + [
                index_learning_resources.si(
                    ids,
                    COURSE_TYPE,
                    index_types=IndexestoUpdate.reindexing_index.value,
                )
                for ids in chunks(
                    Course.objects.filter(learning_resource__published=True)
                    .exclude(learning_resource__readable_id=blocklisted_ids)
                    .order_by("learning_resource_id")
                    .values_list("learning_resource_id", flat=True),
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                )
            ]

            for course in (
                Course.objects.filter(learning_resource__published=True)
                .filter(learning_resource__etl_source__in=RESOURCE_FILE_ETL_SOURCES)
                .exclude(learning_resource__readable_id=blocklisted_ids)
                .order_by("learning_resource_id")
            ):
                index_tasks = index_tasks + [
                    index_content_files.si(
                        ids,
                        course.learning_resource_id,
                        index_types=IndexestoUpdate.reindexing_index.value,
                    )
                    for ids in chunks(
                        ContentFile.objects.filter(
                            run__learning_resource_id=course.learning_resource_id,
                            published=True,
                            run__published=True,
                        )
                        .order_by("id")
                        .values_list("id", flat=True),
                        chunk_size=settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE,
                    )
                ]

        for resource_type in [
            PROGRAM_TYPE,
            PODCAST_TYPE,
            PODCAST_EPISODE_TYPE,
            LEARNING_PATH_TYPE,
            VIDEO_TYPE,
            VIDEO_PLAYLIST_TYPE,
        ]:
            if resource_type in indexes:
                index_tasks = index_tasks + [
                    index_learning_resources.si(
                        ids,
                        resource_type,
                        index_types=IndexestoUpdate.reindexing_index.value,
                    )
                    for ids in chunks(
                        LearningResource.objects.filter(
                            published=True, resource_type=resource_type
                        )
                        .order_by("id")
                        .values_list("id", flat=True),
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
def start_update_index(self, indexes, etl_source):
    """
    Wipe and recreate index and mapping, and index all items.
    """
    try:
        log.info("starting to index %s objects...", ", ".join(indexes))

        index_tasks = []

        if COURSE_TYPE in indexes or CONTENT_FILE_TYPE in indexes:
            blocklisted_ids = load_course_blocklist()

        if COURSE_TYPE in indexes:
            index_tasks = index_tasks + get_update_courses_tasks(
                blocklisted_ids, etl_source
            )

        if CONTENT_FILE_TYPE in indexes:
            index_tasks = index_tasks + get_update_resource_files_tasks(
                blocklisted_ids, etl_source
            )
        if PERCOLATE_INDEX_TYPE in indexes:
            index_tasks = index_tasks + get_update_percolator_tasks()

        for resource_type in [
            PROGRAM_TYPE,
            PODCAST_TYPE,
            PODCAST_EPISODE_TYPE,
            LEARNING_PATH_TYPE,
            VIDEO_TYPE,
            VIDEO_PLAYLIST_TYPE,
        ]:
            if resource_type in indexes:
                index_tasks = index_tasks + get_update_learning_resource_tasks(
                    resource_type
                )

        index_tasks = celery.group(index_tasks)
    except:  # noqa: E722
        error = "start_update_index threw an error"
        log.exception(error)
        return [error]

    raise self.replace(index_tasks)


def get_update_resource_files_tasks(blocklisted_ids, etl_source):
    """
    Get list of tasks to update course files.
    This task upserts content files for courses that are published and delists content
    files that are not published but are part of a published course.

    Args:
        blocklisted_ids(list of int): List of course id's to exclude
        etl_source(str): ETL source filter for the task
    """

    if etl_source is None or etl_source in RESOURCE_FILE_ETL_SOURCES:
        course_update_query = (
            LearningResource.objects.filter(published=True, resource_type=COURSE_TYPE)
            .exclude(readable_id__in=blocklisted_ids)
            .order_by("id")
        )

        if etl_source:
            course_update_query = course_update_query.filter(etl_source=etl_source)
        else:
            course_update_query = course_update_query.filter(
                etl_source__in=RESOURCE_FILE_ETL_SOURCES
            )

        index_tasks = []

        for learning_resource in course_update_query.order_by("id"):
            index_tasks = index_tasks + [
                index_content_files.si(
                    ids,
                    learning_resource.id,
                    index_types=IndexestoUpdate.current_index.value,
                )
                for ids in chunks(
                    ContentFile.objects.filter(
                        run__learning_resource_id=learning_resource.id,
                        published=True,
                        run__published=True,
                    )
                    .order_by("id")
                    .values_list("id", flat=True),
                    chunk_size=settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE,
                )
            ]

            index_tasks = index_tasks + [
                deindex_content_files.si(ids, learning_resource.id)
                for ids in chunks(
                    ContentFile.objects.filter(
                        run__learning_resource_id=learning_resource.id
                    )
                    .filter(Q(published=False) | Q(run__published=False))
                    .order_by("id")
                    .values_list("id", flat=True),
                    chunk_size=settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE,
                )
            ]

        return index_tasks
    else:
        return []


def get_update_courses_tasks(blocklisted_ids, etl_source):
    """
    Get list of tasks to update courses
    Args:
        blocklisted_ids(list of int): List of course id's to exclude
        etl_source(str): Etl source filter for the task
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

    if etl_source:
        course_update_query = course_update_query.filter(etl_source=etl_source)
        course_deletion_query = course_deletion_query.filter(etl_source=etl_source)

    index_tasks = [
        index_learning_resources.si(
            ids, COURSE_TYPE, index_types=IndexestoUpdate.current_index.value
        )
        for ids in chunks(
            course_update_query.values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]

    return index_tasks + [
        bulk_deindex_learning_resources.si(ids, COURSE_TYPE)
        for ids in chunks(
            course_deletion_query.values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]


def get_update_percolator_tasks():
    """
    Get list of tasks to update percolators
    """
    index_tasks = [
        bulk_index_percolate_queries.si(
            percolate_ids, index_types=IndexestoUpdate.current_index.value
        )
        for percolate_ids in chunks(
            PercolateQuery.objects.order_by("id").values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]

    return index_tasks + [
        bulk_deindex_percolators.si(ids)
        for ids in chunks(
            PercolateQuery.objects.all().order_by("id").values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]


def get_update_learning_resource_tasks(resource_type):
    """
    Get list of tasks to update non-course learning resources
    """
    index_tasks = [
        index_learning_resources.si(
            ids, resource_type, index_types=IndexestoUpdate.current_index.value
        )
        for ids in chunks(
            LearningResource.objects.filter(published=True, resource_type=resource_type)
            .order_by("id")
            .values_list("id", flat=True),
            chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
        )
    ]

    return index_tasks + [
        bulk_deindex_learning_resources.si(ids, resource_type)
        for ids in chunks(
            LearningResource.objects.filter(
                published=False, resource_type=resource_type
            )
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


@app.task(
    acks_late=True,
    reject_on_worker_lost=True,
    rate_limit=settings.NOTIFICATION_ATTEMPT_RATE_LIMIT,
)
def attempt_send_digest_email_batch(user_template_items):
    for user_id, template_data in user_template_items:
        log.info("Sending email to user %s", user_id)
        user = User.objects.get(id=user_id)
        total_count = sum([len(template_data[group]) for group in template_data])
        subject = f"{settings.MITOPEN_TITLE} New Learning Resources for You"
        send_template_email(
            [user.email],
            subject,
            "email/subscribed_channel_digest.html",
            context={
                "documents": template_data,
                "total_count": total_count,
                "subject": subject,
            },
        )
