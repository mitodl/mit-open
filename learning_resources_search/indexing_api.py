"""
Functions and constants for OpenSearch indexing
"""

import json
import logging
from math import ceil

from django.conf import settings
from django.contrib.auth import get_user_model
from opensearchpy.exceptions import ConflictError, NotFoundError
from opensearchpy.helpers import BulkIndexError, bulk

from learning_resources.models import (
    ContentFile,
    ContentFileEmbedding,
    LearningResourceRun,
)
from learning_resources_search.connection import (
    get_active_aliases,
    get_conn,
    get_default_alias_name,
    get_reindexing_alias_name,
    make_backing_index_name,
    refresh_index,
)
from learning_resources_search.constants import (
    ALIAS_ALL_INDICES,
    CONTENT_EMBEDDING_TYPE,
    COURSE_TYPE,
    LEARNING_RESOURCE_TYPES,
    MAPPING,
    IndexestoUpdate,
)
from learning_resources_search.exceptions import ReindexError
from learning_resources_search.serializers import (
    serialize_bulk_learning_resources,
    serialize_bulk_learning_resources_for_deletion,
    serialize_content_embedding_for_bulk,
    serialize_content_file_for_bulk,
    serialize_content_file_for_bulk_deletion,
)
from open_discussions.utils import chunks

log = logging.getLogger(__name__)
User = get_user_model()


def _update_document_by_id(doc_id, body, object_type, *, retry_on_conflict=0, **kwargs):
    """
    Makes a request to ES to update an existing document

    Args:
        doc_id (str): The ES document id
        body (dict): ES update operation body
        object_type (str): The object type to update.
        retry_on_conflict (int): Number of times to retry if there's a conflict (default=0)
        kwargs (dict): Optional kwargs to be passed to opensearch
    """  # noqa: D401
    conn = get_conn()
    for alias in get_active_aliases(conn, object_types=[object_type]):
        try:
            conn.update(
                index=alias,
                body=body,
                id=doc_id,
                params={"retry_on_conflict": retry_on_conflict, **kwargs},
            )
        # Our policy for document update-related version conflicts right now is to log them
        # and allow the app to continue as normal.
        except ConflictError:
            log.error(  # noqa: TRY400
                "Update API request resulted in a version conflict (alias: %s, doc"
                " id: %s)",
                alias,
                doc_id,
            )


def clear_and_create_index(*, index_name=None, skip_mapping=False, object_type=None):
    """
    Wipe and recreate index and mapping. No indexing is done.

    Args:
        index_name (str): The name of the index to clear
        skip_mapping (bool): If true, don't set any mapping
        object_type(str): The type of document (post, comment)
    """
    if object_type not in LEARNING_RESOURCE_TYPES:
        msg = (
            "A valid object type must be specified when clearing and creating an index"
        )
        raise ValueError(msg)
    conn = get_conn()
    if conn.indices.exists(index_name):
        conn.indices.delete(index_name)
    index_create_data = {
        "settings": {
            "index": {
                "number_of_shards": settings.OPENSEARCH_SHARD_COUNT,
                "number_of_replicas": settings.OPENSEARCH_REPLICA_COUNT,
                "refresh_interval": "60s",
                "knn": True,
                "knn.algo_param.ef_search": 100,
                # "default_pipeline": "nlp-ingest-pipeline",
            },
            "analysis": {
                "analyzer": {
                    "folding": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": [
                            "lowercase",
                            "asciifolding",  # remove accents if we use folding analyzer
                        ],
                    },
                    "trigram": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "shingle"],
                    },
                },
                "filter": {
                    "shingle": {
                        "type": "shingle",
                        "min_shingle_size": 2,
                        "max_shingle_size": 3,
                    }
                },
            },
        }
    }
    if not skip_mapping:
        index_create_data["mappings"] = {"properties": MAPPING[object_type]}
    # from https://www.elastic.co/guide/en/elasticsearch/guide/current/asciifolding-token-filter.html
    conn.indices.create(index_name, body=index_create_data)


def upsert_document(doc_id, doc, object_type, *, retry_on_conflict=0, **kwargs):
    """
    Make a request to ES to create or update a document

    Args:
        doc_id (str): The ES document id
        doc (dict): Full ES document
        object_type (str): The object type to update (course, program, etc)
        retry_on_conflict (int): Number of times to retry if there's a
            conflict (default=0)
        kwargs (dict): Optional kwargs to be passed to opensearch
    """
    _update_document_by_id(
        doc_id,
        {"doc": doc, "doc_as_upsert": True},
        object_type,
        retry_on_conflict=retry_on_conflict,
        **kwargs,
    )


def deindex_items(documents, object_type, index_types, **kwargs):
    """
    Call index_items with error catching around not_found for objects that don't exist
    in the index

    Args:
        documents (iterable of dict): An iterable with opensearch documents to index
        object_type (str): the ES object type
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated

    """

    try:
        index_items(documents, object_type, index_types, **kwargs)
    except BulkIndexError as error:
        error_messages = error.args[1]

        for error_message in error_messages:
            message = next(iter(error_message.values()))
            if message["result"] != "not_found":
                log.exception("Bulk deindex failed. Error: %s", str(message))
                msg = f"Bulk deindex failed: {message}"
                raise ReindexError(msg) from error


def index_items(documents, object_type, index_types, **kwargs):
    """
    Index items based on list of item ids

    Args:
        documents (iterable of dict): An iterable with opensearch documents to index
        object_type (str): the ES object type
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated
    """
    conn = get_conn()
    # bulk will also break an iterable into chunks. However we should do this here so
    # that we can use the same documents when indexing to multiple aliases.
    for chunk in chunks(documents, chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE):
        documents_size = len(json.dumps(chunk, default=str))
        # Keep chunking the chunks until either the size is acceptable or there's
        # nothing left to chunk
        if documents_size > settings.OPENSEARCH_MAX_REQUEST_SIZE:
            if len(chunk) == 1:
                log.error(
                    "Document id %s for object_type %s exceeds max size %d: %d",
                    chunk[0]["_id"],
                    object_type,
                    settings.OPENSEARCH_MAX_REQUEST_SIZE,
                    documents_size,
                )
                continue
            num_chunks = min(
                ceil(
                    len(chunk)
                    / ceil(documents_size / settings.OPENSEARCH_MAX_REQUEST_SIZE)
                ),
                len(chunk) - 1,
            )
            for smaller_chunk in chunks(chunk, chunk_size=num_chunks):
                index_items(smaller_chunk, object_type, index_types, **kwargs)
        else:
            for alias in get_active_aliases(
                conn, object_types=[object_type], index_types=index_types
            ):
                _, errors = bulk(
                    conn,
                    chunk,
                    index=alias,
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                    **kwargs,
                )
                if len(errors) > 0:
                    log.error(errors)
                    msg = f"Error during bulk {object_type} insert: {errors}"
                    raise ReindexError(msg)


def index_learning_resources(ids, resource_type, index_types):
    """
    Index a list of learning resources by id

    Args:
        ids(list of int): List of learning resource id's
        resource_type: The resource type of the resources
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated

    """
    index_items(serialize_bulk_learning_resources(ids), resource_type, index_types)


def deindex_learning_resources(ids, resource_type):
    """
    Deindex a list of learning resources by id

    Args:
        ids(list of int): List of learning resource ids
        resource_type: resource type
    """
    deindex_items(
        serialize_bulk_learning_resources_for_deletion(ids),
        resource_type,
        index_types=IndexestoUpdate.all_indexes.value,
    )

    if resource_type == COURSE_TYPE:
        for run_id in LearningResourceRun.objects.filter(
            learning_resource_id__in=ids
        ).values_list("id", flat=True):
            deindex_run_content_files(run_id, unpublished_only=False)


def index_course_content_files(learning_resource_ids, index_types):
    """
    Index a list of content files by course ids

    Args:
        learning_resource_ids(list of int): List of Learning Resource id's
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated

    """
    for run_id in LearningResourceRun.objects.filter(
        learning_resource_id__in=learning_resource_ids, published=True
    ).values_list("id", flat=True):
        index_run_content_files(run_id, index_types)
        index_run_content_embeddings(run_id, index_types)


def index_run_content_files(run_id, index_types):
    """
    Index a list of content files by run id

    Args:
        run_id(int): Course run id
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated
    """
    run = LearningResourceRun.objects.get(pk=run_id)
    content_file_ids = run.content_files.filter(published=True).values_list(
        "id", flat=True
    )

    for ids_chunk in chunks(
        content_file_ids, chunk_size=settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE
    ):
        documents = (
            serialize_content_file_for_bulk(content_file)
            for content_file in ContentFile.objects.filter(pk__in=ids_chunk)
        )

        index_items(
            documents,
            COURSE_TYPE,
            index_types=index_types,
            routing=run.learning_resource.id,
        )


def deindex_run_content_files(run_id, unpublished_only):
    """
    Deindex and delete a list of content files by run from the index

    Args:
        run_id(int): Course run id
        unpublished_only(bool): if true only delete  files with published=False

    """
    run = LearningResourceRun.objects.get(id=run_id)
    if unpublished_only:
        content_files = run.content_files.filter(published=False).all()
    else:
        content_files = run.content_files.all()

    if not content_files.exists():
        return

    documents = (
        serialize_content_file_for_bulk_deletion(content_file)
        for content_file in content_files
        if len(content_file.content)
    )

    deindex_items(
        documents,
        COURSE_TYPE,
        index_types=IndexestoUpdate.all_indexes.value,
        routing=run.learning_resource_id,
    )


def index_run_content_embeddings(run_id, index_types):
    """
    Index a list of content embeddings by run id

    Args:
        run_id(int): Course run id
        index_types (string): one of the values IndexestoUpdate. Whether the default
            index, the reindexing index or both need to be updated
    """
    run = LearningResourceRun.objects.get(id=run_id)
    content_embedding_ids = (
        run.content_files.filter(published=True)
        .exclude(embeddings__isnull=True)
        .values_list("embeddings__id", flat=True)
        .distinct()
    )

    for ids_chunk in chunks(
        content_embedding_ids,
        chunk_size=settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE,
    ):
        documents = (
            serialize_content_embedding_for_bulk(content_embedding)
            for content_embedding in ContentFileEmbedding.objects.filter(
                pk__in=ids_chunk
            )
        )

        index_items(
            documents,
            CONTENT_EMBEDDING_TYPE,
            index_types=index_types,
            routing=run.learning_resource.id,
        )


def deindex_run_content_embeddings(run_id, unpublished_only):
    """
    Deindex and delete a list of content files by run from the index

    Args:
        run_id(int): Course run id
        unpublished_only(bool): if true only delete  files with published=False

    """
    run = LearningResourceRun.objects.get(id=run_id)
    if unpublished_only:
        content_file_ids = run.content_files.filter(published=False).values_list(
            "id", flat=True
        )
    else:
        content_file_ids = run.content_files.all().values_list("id", flat=True)
    content_embeddings = ContentFileEmbedding.objects.filter(
        content_file_id__in=content_file_ids
    ).all()

    if not content_embeddings.exists():
        return

    documents = (
        serialize_content_file_for_bulk_deletion(content_embedding)
        for content_embedding in content_embeddings
    )

    deindex_items(
        documents,
        CONTENT_EMBEDDING_TYPE,
        index_types=IndexestoUpdate.all_indexes.value,
        routing=run.learning_resource_id,
    )


def deindex_document(doc_id, object_type, **kwargs):
    """
    Make a request to ES to delete a document

    Args:
        doc_id (str): The ES document id
        object_type (str): The object type
        kwargs (dict): optional parameters for the request
    """
    conn = get_conn()
    for alias in get_active_aliases(conn, object_types=[object_type]):
        try:
            conn.delete(index=alias, id=doc_id, params=kwargs)
        except NotFoundError:
            log.debug(
                "Tried to delete an ES document that didn't exist, doc_id: '%s'", doc_id
            )


def create_backing_index(object_type):
    """
    Start the reindexing process by creating a new backing index and pointing the
    reindex alias toward it

    Args:
        object_type (str): The object type for the index (post, comment, etc)

    Returns:
        str: The new backing index
    """
    conn = get_conn()

    # Create new backing index for reindex
    new_backing_index = make_backing_index_name(object_type)

    # Clear away temp alias so we can reuse it, and create mappings
    clear_and_create_index(index_name=new_backing_index, object_type=object_type)
    temp_alias = get_reindexing_alias_name(object_type)
    if conn.indices.exists_alias(name=temp_alias):
        # Deletes both alias and backing indexes
        indices = conn.indices.get_alias(temp_alias).keys()
        for index in indices:
            conn.indices.delete_alias(index=index, name=temp_alias)

    # Point temp_alias toward new backing index
    conn.indices.put_alias(index=new_backing_index, name=temp_alias)

    return new_backing_index


def switch_indices(backing_index, object_type):
    """
    Switch the default index to point to the backing index, and delete the reindex alias

    Args:
        backing_index (str): The backing index of the reindex alias
        object_type (str): The object type for the index (post, comment, etc)
    """
    conn = get_conn()
    actions = []
    old_backing_indexes = []
    default_alias = get_default_alias_name(object_type)
    global_alias = get_default_alias_name(ALIAS_ALL_INDICES)
    if conn.indices.exists_alias(name=default_alias):
        # Should only be one backing index in normal circumstances
        old_backing_indexes = list(conn.indices.get_alias(name=default_alias).keys())
        for index in old_backing_indexes:
            actions.extend(
                [
                    {"remove": {"index": index, "alias": default_alias}},
                    {"remove": {"index": index, "alias": global_alias}},
                ]
            )
    actions.extend(
        [
            {"add": {"index": backing_index, "alias": default_alias}},
            {"add": {"index": backing_index, "alias": global_alias}},
        ]
    )
    conn.indices.update_aliases({"actions": actions})
    refresh_index(backing_index)
    for index in old_backing_indexes:
        conn.indices.delete(index)

    # Finally, remove the link to the reindexing alias
    conn.indices.delete_alias(
        name=get_reindexing_alias_name(object_type), index=backing_index
    )


def delete_orphaned_indices():
    """
    Delete any indices without aliases and any reindexing aliases
    """
    conn = get_conn()
    indices = conn.indices.get_alias(index="*")
    for index in indices:
        aliases = indices[index]["aliases"]
        keys = list(aliases)
        for alias in aliases:
            if "reindexing" in alias:
                log.info("Deleting alias %s for index %s", alias, index)
                conn.indices.delete_alias(name=alias, index=index)
                keys.remove(alias)
        if not keys:
            log.info("Deleting index %s", index)
            conn.indices.delete(index)
