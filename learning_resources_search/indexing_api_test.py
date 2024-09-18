"""
Tests for the indexing API
"""

import json
from math import ceil
from types import SimpleNamespace

import pytest
from anys import ANY_DICT, ANY_STR
from opensearchpy.exceptions import ConflictError, NotFoundError

from learning_resources.factories import (
    ContentFileFactory,
    CourseFactory,
    LearningResourceRunFactory,
)
from learning_resources.models import ContentFile
from learning_resources.serializers import ContentFileSerializer
from learning_resources_search import indexing_api
from learning_resources_search.connection import get_default_alias_name
from learning_resources_search.constants import (
    ALIAS_ALL_INDICES,
    COURSE_TYPE,
    PROGRAM_TYPE,
    IndexestoUpdate,
)
from learning_resources_search.exceptions import ReindexError
from learning_resources_search.factories import PercolateQueryFactory
from learning_resources_search.indexing_api import (
    clear_and_create_index,
    clear_featured_rank,
    create_backing_index,
    deindex_content_files,
    deindex_document,
    deindex_learning_resources,
    deindex_percolators,
    deindex_run_content_files,
    delete_orphaned_indexes,
    get_reindexing_alias_name,
    index_content_files,
    index_course_content_files,
    index_items,
    index_learning_resources,
    index_run_content_files,
    switch_indices,
    update_document_with_partial,
)
from learning_resources_search.models import PercolateQuery
from learning_resources_search.utils import remove_child_queries
from main.utils import chunks

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("mocked_es")]


@pytest.fixture
def mocked_es(mocker, settings):
    """ES client objects/functions mock"""
    index_name = "test"
    settings.OPENSEARCH_INDEX = index_name
    conn = mocker.Mock()
    get_conn_patch = mocker.patch(
        "learning_resources_search.indexing_api.get_conn",
        autospec=True,
        return_value=conn,
    )
    mocker.patch("learning_resources_search.connection.get_conn", autospec=True)
    default_alias = get_default_alias_name(COURSE_TYPE)
    reindex_alias = get_reindexing_alias_name(COURSE_TYPE)
    return SimpleNamespace(
        get_conn=get_conn_patch,
        conn=conn,
        index_name=index_name,
        default_alias=default_alias,
        reindex_alias=reindex_alias,
        active_aliases=[default_alias, reindex_alias],
    )


@pytest.mark.parametrize("object_type", [COURSE_TYPE, PROGRAM_TYPE])
@pytest.mark.parametrize("skip_mapping", [True, False])
@pytest.mark.parametrize("already_exists", [True, False])
def test_clear_and_create_index(mocked_es, object_type, skip_mapping, already_exists):
    """
    clear_and_create_index should deindex the index and create a new empty one with a mapping
    """
    index = "index"

    conn = mocked_es.conn
    conn.indices.exists.return_value = already_exists

    clear_and_create_index(
        index_name=index, skip_mapping=skip_mapping, object_type=object_type
    )

    conn.indices.exists.assert_called_once_with(index)
    assert conn.indices.delete.called is already_exists
    if already_exists:
        conn.indices.delete.assert_called_once_with(index)

    assert conn.indices.create.call_count == 1
    assert conn.indices.create.call_args[0][0] == index
    body = conn.indices.create.call_args[1]["body"]

    assert "settings" in body
    assert "mappings" not in body if skip_mapping else "mappings" in body


@pytest.mark.parametrize("object_type", [COURSE_TYPE, PROGRAM_TYPE])
@pytest.mark.parametrize("default_exists", [True, False])
def test_switch_indices(mocked_es, mocker, default_exists, object_type):
    """
    switch_indices should atomically remove the old backing index
    for the default alias and replace it with the new one
    """
    refresh_mock = mocker.patch(
        "learning_resources_search.indexing_api.refresh_index", autospec=True
    )
    conn_mock = mocked_es.conn
    conn_mock.indices.exists_alias.return_value = default_exists
    old_backing_index = "old_backing"
    conn_mock.indices.get_alias.return_value.keys.return_value = [old_backing_index]

    backing_index = "backing"
    switch_indices(backing_index, object_type)

    conn_mock.indices.delete_alias.assert_any_call(
        name=get_reindexing_alias_name(object_type), index=backing_index
    )
    default_alias = get_default_alias_name(object_type)
    all_alias = get_default_alias_name(ALIAS_ALL_INDICES)
    conn_mock.indices.exists_alias.assert_called_once_with(name=default_alias)

    actions = []
    if default_exists:
        actions.extend(
            [
                {"remove": {"index": old_backing_index, "alias": default_alias}},
                {"remove": {"index": old_backing_index, "alias": all_alias}},
            ]
        )
    actions.extend(
        [
            {"add": {"index": backing_index, "alias": default_alias}},
            {"add": {"index": backing_index, "alias": all_alias}},
        ]
    )
    conn_mock.indices.update_aliases.assert_called_once_with({"actions": actions})
    refresh_mock.assert_called_once_with(backing_index)
    if default_exists:
        conn_mock.indices.delete.assert_called_once_with(old_backing_index)
    else:
        assert conn_mock.indices.delete.called is False

    conn_mock.indices.delete_alias.assert_called_once_with(
        name=get_reindexing_alias_name(object_type), index=backing_index
    )


@pytest.mark.parametrize("temp_alias_exists", [True, False])
def test_create_backing_index(mocked_es, mocker, temp_alias_exists):
    """create_backing_index should make a new backing index and set the reindex alias to point to it"""
    reindexing_alias = get_reindexing_alias_name(COURSE_TYPE)
    backing_index = "backing_index"
    conn_mock = mocked_es.conn
    conn_mock.indices.exists_alias.return_value = temp_alias_exists
    get_alias = conn_mock.indices.get_alias
    get_alias.return_value = (
        {backing_index: {"alias": {reindexing_alias: {}}}} if temp_alias_exists else {}
    )
    clear_and_create_mock = mocker.patch(
        "learning_resources_search.indexing_api.clear_and_create_index", autospec=True
    )
    make_backing_index_mock = mocker.patch(
        "learning_resources_search.indexing_api.make_backing_index_name",
        return_value=backing_index,
    )

    assert create_backing_index(COURSE_TYPE) == backing_index

    get_conn_mock = mocked_es.get_conn
    get_conn_mock.assert_called_once_with()
    make_backing_index_mock.assert_called_once_with(COURSE_TYPE)
    clear_and_create_mock.assert_called_once_with(
        index_name=backing_index, object_type=COURSE_TYPE
    )

    conn_mock.indices.exists_alias.assert_called_once_with(name=reindexing_alias)
    if temp_alias_exists:
        conn_mock.indices.delete_alias.assert_any_call(
            index=backing_index, name=reindexing_alias
        )
    assert conn_mock.indices.delete_alias.called is temp_alias_exists

    conn_mock.indices.put_alias.assert_called_once_with(
        index=backing_index, name=reindexing_alias
    )


@pytest.mark.parametrize("errors", [(), "error"])
@pytest.mark.parametrize(
    "index_types",
    [
        IndexestoUpdate.current_index.value,
        IndexestoUpdate.reindexing_index.value,
        IndexestoUpdate.all_indexes.value,
    ],
)
def test_index_learning_resources(
    mocked_es,
    mocker,
    settings,
    errors,
    index_types,
):
    """
    index functions should call bulk with correct arguments
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 3
    documents = ["doc1", "doc2", "doc3", "doc4", "doc5"]
    mock_get_aliases = mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=["a", "b"],
    )
    mocker.patch(
        "learning_resources_search.indexing_api.serialize_bulk_learning_resources",
        autospec=True,
        return_value=(doc for doc in documents),
    )
    bulk_mock = mocker.patch(
        "learning_resources_search.indexing_api.bulk",
        autospec=True,
        return_value=(0, errors),
    )

    if errors:
        with pytest.raises(ReindexError):
            index_learning_resources([1, 2, 3], COURSE_TYPE, index_types)
    else:
        index_learning_resources([1, 2, 3], COURSE_TYPE, index_types)
        mock_get_aliases.assert_called_with(
            mocked_es.conn,
            object_types=[COURSE_TYPE],
            index_types=index_types,
        )

        for alias in mock_get_aliases.return_value:
            for chunk in chunks(
                documents, chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE
            ):
                bulk_mock.assert_any_call(
                    mocked_es.conn,
                    chunk,
                    index=alias,
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                )


@pytest.mark.parametrize("errors", [(), "error"])
def test_deindex_learning_resources(mocked_es, mocker, settings, errors):
    """
    Deindex functions should call bulk with correct arguments
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 3
    documents = ["doc1", "doc2", "doc3", "doc4", "doc5"]
    mock_get_aliases = mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=["a", "b"],
    )
    mocker.patch(
        "learning_resources_search.indexing_api.serialize_bulk_learning_resources_for_deletion",
        autospec=True,
        return_value=(doc for doc in documents),
    )
    bulk_mock = mocker.patch(
        "learning_resources_search.indexing_api.bulk",
        autospec=True,
        return_value=(0, errors),
    )

    if errors:
        with pytest.raises(ReindexError):
            deindex_learning_resources([1, 2, 3], COURSE_TYPE)
    else:
        deindex_learning_resources([1, 2, 3], COURSE_TYPE)
        mock_get_aliases.assert_called_with(
            mocked_es.conn,
            object_types=[COURSE_TYPE],
            index_types=IndexestoUpdate.all_indexes.value,
        )

        for alias in mock_get_aliases.return_value:
            for chunk in chunks(
                documents, chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE
            ):
                bulk_mock.assert_any_call(
                    mocked_es.conn,
                    chunk,
                    index=alias,
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                )


def test_deindex_document(mocked_es, mocker):
    """
    ES should try removing the specified document from the correct index
    """
    mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=["a"],
    )
    deindex_document(1, "course")
    mocked_es.conn.delete.assert_called_with(index="a", id=1, params={})


def test_deindex_document_not_found(mocked_es, mocker):
    """
    ES should try removing the specified document from the correct index
    """
    patched_logger = mocker.patch("learning_resources_search.indexing_api.log")
    mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=["a"],
    )
    mocked_es.conn.delete.side_effect = NotFoundError
    deindex_document(1, "course")
    assert patched_logger.debug.called is True


@pytest.mark.parametrize(("max_size", "chunks"), [(10000, 2), (500, 4)])
@pytest.mark.parametrize("exceeds_size", [True, False])
def test_index_items_size_limits(settings, mocker, max_size, chunks, exceeds_size):
    """
    Chunks should get split into smaller chunks if necessary, log error if single-file chunks too big
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 5
    settings.OPENSEARCH_MAX_REQUEST_SIZE = max_size
    mock_aliases = mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=[],
    )
    mock_log = mocker.patch("learning_resources_search.indexing_api.log.error")
    documents = [
        {"_id": 1, "content": "a" * (max_size if exceeds_size else 100)}
        for _ in range(10)
    ]
    index_items(documents, "course", index_types=IndexestoUpdate.current_index.value)
    assert mock_aliases.call_count == (chunks if not exceeds_size else 0)
    assert mock_log.call_count == (10 if exceeds_size else 0)


@pytest.mark.parametrize("delete_reindexing_tags", [True, False])
def test_delete_orphaned_indexes(mocker, mocked_es, delete_reindexing_tags):
    """
    Delete any indices without aliases and any reindexing aliases
    """
    mock_aliases = {
        "discussions_local_program_d6884bba05484cbb8c9b1e61d15ff354": {
            "aliases": {
                "discussions_local_all_default": {},
                "discussions_local_program_default": {},
            }
        },
        "discussions_local_program_b8c9b1e61d15ff354f6884bba05484cb": {
            "aliases": {"discussions_local_program_reindexing": {}}
        },
        "discussions_local_program_1e61d15ff35b8c9b4f6884bba05484cb": {
            "aliases": {
                "discussions_local_program_reindexing": {},
                "some_other_alias": {},
            }
        },
        "discussions_local_podcast_1e61d15ff35b8c9b4f6884bba05484cb": {
            "aliases": {
                "discussions_local_program_reindexing": {},
                "some_other_alias": {},
            }
        },
        "discussions_local_program_5484cbb8c9b1e61d15ff354f6884bba0": {"aliases": {}},
        "discussions_local_course_15ff354d6884bba05484cbb8c9b1e61d": {
            "aliases": {
                "discussions_local_all_default": {},
                "discussions_local_course_default": {},
            }
        },
    }
    mocked_es.conn.indices = mocker.Mock(
        delete_alias=mocker.Mock(), get_alias=mocker.Mock(return_value=mock_aliases)
    )
    delete_orphaned_indexes(["program"], delete_reindexing_tags=delete_reindexing_tags)
    mocked_es.conn.indices.get_alias.assert_called_once_with(index="*")

    if delete_reindexing_tags:
        mocked_es.conn.indices.delete_alias.assert_any_call(
            name="discussions_local_program_reindexing",
            index="discussions_local_program_b8c9b1e61d15ff354f6884bba05484cb",
        )
        mocked_es.conn.indices.delete_alias.assert_any_call(
            name="discussions_local_program_reindexing",
            index="discussions_local_program_1e61d15ff35b8c9b4f6884bba05484cb",
        )
    else:
        mocked_es.conn.indices.delete_alias.assert_not_called()

    mocked_es.conn.indices.delete.assert_any_call(
        "discussions_local_program_5484cbb8c9b1e61d15ff354f6884bba0"
    )

    if delete_reindexing_tags:
        mocked_es.conn.indices.delete.assert_any_call(
            "discussions_local_program_b8c9b1e61d15ff354f6884bba05484cb"
        )
        assert mocked_es.conn.indices.delete.call_count == 2
    else:
        assert mocked_es.conn.indices.delete.call_count == 1


def test_bulk_content_file_deindex_on_course_deletion(mocker):
    """
    OpenSearch should deindex content files on bulk  course deletion
    """
    mock_deindex_run_content_files = mocker.patch(
        "learning_resources_search.indexing_api.deindex_run_content_files",
        autospec=True,
    )
    mocker.patch("learning_resources_search.indexing_api.deindex_items", autospec=True)

    courses = CourseFactory.create_batch(2)
    deindex_learning_resources(
        [course.learning_resource_id for course in courses], COURSE_TYPE
    )
    for course in courses:
        for run in course.learning_resource.runs.all():
            mock_deindex_run_content_files.assert_any_call(
                run.id, unpublished_only=False
            )


def test_deindex_run_content_files(mocker):
    """deindex_run_content_files should remove them from index and db"""
    mock_deindex = mocker.patch("learning_resources_search.indexing_api.deindex_items")
    run = LearningResourceRunFactory.create(published=True)
    ContentFileFactory.create_batch(3, run=run, published=True)
    assert ContentFile.objects.count() == 3
    deindex_run_content_files(run.id, unpublished_only=False)
    mock_deindex.assert_called_once()
    run.refresh_from_db()
    assert ContentFile.objects.count() == 0


def test_index_course_content_files(mocker):
    """
    OpenSearch should try indexing content files for all runs in a course
    """
    mock_index_run_content_files = mocker.patch(
        "learning_resources_search.indexing_api.index_run_content_files", autospec=True
    )
    courses = CourseFactory.create_batch(2)
    index_course_content_files(
        [course.learning_resource_id for course in courses],
        IndexestoUpdate.current_index.value,
    )
    for course in courses:
        for run in course.runs.all():
            mock_index_run_content_files.assert_any_call(
                run.id, IndexestoUpdate.current_index.value
            )


@pytest.mark.parametrize("content_file_count", [3, 17])
@pytest.mark.parametrize(
    "index_types",
    [None, IndexestoUpdate.current_index.value, IndexestoUpdate.all_indexes.value],
)
def test_index_run_content_files(settings, mocker, content_file_count, index_types):
    """
    Run ContentFiles should be indexed correctly
    """
    chunk_size = 5
    settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE = chunk_size
    run = LearningResourceRunFactory.create(published=True)
    content_files = ContentFileFactory.create_batch(
        content_file_count, run=run, published=True
    )
    ContentFileFactory.create_batch(5, run=run, published=False)
    mock_index_content_files = mocker.patch(
        "learning_resources_search.indexing_api.index_content_files", autospec=True
    )

    index_run_content_files(run.id, index_types)

    expected_call_count = ceil(content_file_count / chunk_size)
    expected_ids = {f.id for f in content_files}

    assert mock_index_content_files.call_count == expected_call_count

    # We want to ensure that all content files are indexed, but the order isn't
    # guaranteed, so walk all the calls and at the end assert there are no file
    # ids that weren't passed.
    # As such, we are doing this a bit different rather than assert_any_call.
    for call in mock_index_content_files.call_args_list:
        ids, _, _ = call.args

        assert call.args == (ids, run.learning_resource.id, index_types)

        ids = set(ids)

        assert ids <= expected_ids

        expected_ids = expected_ids - ids

    assert expected_ids == set()


@pytest.mark.parametrize(
    "index_types",
    [None, IndexestoUpdate.current_index.value, IndexestoUpdate.all_indexes.value],
)
def test_index_content_files_serialization(mocker, index_types):
    """index_content_files should prefetch and serialize the records correctly"""
    run = LearningResourceRunFactory.create(published=True)
    ContentFileFactory.create_batch(5, run=run, published=True)

    mock_index_items = mocker.patch(
        "learning_resources_search.indexing_api.index_items",
        autospec=True,
    )

    content_files = ContentFile.objects.for_serialization().filter(run=run)

    # NOTE: this seems like we're also testing the indexing serialization but what we're really testing this that the for_serialization() call is being done to correctly annotate the objects before serialization
    expected_documents = [
        {
            "_id": ANY_STR,
            "resource_relations": ANY_DICT,
            **ContentFileSerializer(instance=cfile).data,
        }
        for cfile in content_files
    ]

    index_content_files(
        [cfile.id for cfile in content_files], run.learning_resource.id, index_types
    )
    # list() forces an eval here, which we need for django_assert_num_queries()
    documents, ctype = mock_index_items.call_args.args
    documents = list(mock_index_items.call_args.args[0])

    for expected_doc in expected_documents:
        assert expected_doc in documents

    mock_index_items.assert_called_once_with(
        mocker.ANY,
        COURSE_TYPE,
        index_types=index_types,
        routing=run.learning_resource.id,
    )


@pytest.mark.parametrize(
    ("indexing_func_name", "doc", "unpublished_only"),
    [
        ["index_run_content_files", {"_id": "doc"}, None],  # noqa: PT007
        [  # noqa: PT007
            "deindex_run_content_files",
            {"_id": "doc", "_op_type": "deindex"},
            True,
        ],
        [  # noqa: PT007
            "deindex_run_content_files",
            {"_id": "doc", "_op_type": "deindex"},
            False,
        ],
    ],
)
@pytest.mark.parametrize(
    ("indexing_chunk_size", "document_indexing_chunk_size"),
    [[2, 3], [3, 2]],  # noqa: PT007
)
@pytest.mark.parametrize("errors", [[], ["error"]])
def test_bulk_index_content_files(  # noqa: PLR0913
    mocked_es,
    mocker,
    settings,
    errors,
    indexing_func_name,
    doc,
    unpublished_only,
    indexing_chunk_size,
    document_indexing_chunk_size,
):
    """
    index functions for content files should call bulk with correct arguments
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = indexing_chunk_size
    settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE = document_indexing_chunk_size
    course = CourseFactory.create()
    run = LearningResourceRunFactory.create(learning_resource=course.learning_resource)
    content_files = ContentFileFactory.create_batch(5, run=run, published=True)
    deindexed_content_file = ContentFileFactory.create_batch(
        5, run=run, published=False
    )
    mock_get_aliases = mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=["a", "b"],
    )
    bulk_mock = mocker.patch(
        "learning_resources_search.indexing_api.bulk",
        autospec=True,
        return_value=(0, errors),
    )
    mocker.patch(
        "learning_resources_search.indexing_api.serialize_content_file_for_bulk",
        autospec=True,
        return_value=doc,
    )
    mocker.patch(
        "learning_resources_search.indexing_api.serialize_content_file_for_bulk_deletion",
        autospec=True,
        return_value=doc,
    )

    if indexing_func_name == "index_run_content_files":
        chunk_size = min(indexing_chunk_size, document_indexing_chunk_size)
    else:
        chunk_size = indexing_chunk_size

    if errors:
        index_func = getattr(indexing_api, indexing_func_name)

        with pytest.raises(ReindexError):
            index_func(run.id, IndexestoUpdate.all_indexes.value)
    else:
        if indexing_func_name == "index_run_content_files":
            index_run_content_files(run.id, IndexestoUpdate.all_indexes.value)
        else:
            deindex_run_content_files(run.id, unpublished_only=unpublished_only)

        if unpublished_only:
            content_files = deindexed_content_file
        else:
            content_files = [*content_files, deindexed_content_file]

        for alias in mock_get_aliases.return_value:
            for chunk in chunks([doc for _ in content_files], chunk_size=chunk_size):
                bulk_mock.assert_any_call(
                    mocked_es.conn,
                    chunk,
                    index=alias,
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                    routing=course.learning_resource_id,
                )


@pytest.mark.parametrize("errors", [[], ["error"]])
@pytest.mark.parametrize(
    ("indexing_func_name", "doc"),
    [
        ("index_content_files", {"_id": "doc"}),
        (
            "deindex_content_files",
            {"_id": "doc", "_op_type": "deindex"},
        ),
    ],
)
def test_index_content_files(  # noqa: PLR0913
    mocked_es,
    mocker,
    settings,
    errors,
    indexing_func_name,
    doc,
):
    """
    index functions for content files should call bulk with correct arguments
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 6
    course = CourseFactory.create()
    run = LearningResourceRunFactory.create(learning_resource=course.learning_resource)
    content_files = ContentFileFactory.create_batch(5, run=run)
    content_file_ids = [content_file.id for content_file in content_files]

    mock_get_aliases = mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=["a", "b"],
    )
    bulk_mock = mocker.patch(
        "learning_resources_search.indexing_api.bulk",
        autospec=True,
        return_value=(0, errors),
    )
    mocker.patch(
        "learning_resources_search.indexing_api.serialize_content_file_for_bulk",
        autospec=True,
        return_value=doc,
    )
    mocker.patch(
        "learning_resources_search.indexing_api.serialize_content_file_for_bulk_deletion",
        autospec=True,
        return_value=doc,
    )

    if errors:
        if indexing_func_name == "index_content_files":
            with pytest.raises(ReindexError):
                index_content_files(
                    content_file_ids,
                    course.learning_resource_id,
                    IndexestoUpdate.all_indexes.value,
                )
        else:
            with pytest.raises(ReindexError):
                deindex_content_files(content_file_ids, course.learning_resource_id)
    else:
        if indexing_func_name == "index_content_files":
            index_content_files(
                content_file_ids,
                course.learning_resource_id,
                IndexestoUpdate.all_indexes.value,
            )
        else:
            deindex_content_files(content_file_ids, course.learning_resource_id)

        for alias in mock_get_aliases.return_value:
            bulk_mock.assert_any_call(
                mocked_es.conn,
                [doc for _ in content_files],
                index=alias,
                chunk_size=6,
                routing=course.learning_resource_id,
            )


@pytest.mark.parametrize("has_files", [True, False])
def test_deindex_run_content_files_no_files(mocker, has_files):
    """deindex_run_content_files shouldn't do anything if there are no content files"""
    mock_deindex_items = mocker.patch(
        "learning_resources_search.indexing_api.deindex_items"
    )
    run = LearningResourceRunFactory.create(published=True)
    if has_files:
        ContentFileFactory.create(run=run, published=False)
    deindex_run_content_files(run.id, unpublished_only=True)
    assert mock_deindex_items.call_count == (1 if has_files else 0)


def test_percolate_query_format():
    """Test utility function to remove related queries from percolate"""
    percolate_query = {
        "bool": {
            "must": [
                {
                    "bool": {
                        "has_child": {
                            "type": "content_file",
                            "query": {
                                "multi_match": {
                                    "query": "test",
                                    "fields": [
                                        "content",
                                        "title.english^3",
                                        "short_description.english^2",
                                        "content_feature_type",
                                    ],
                                }
                            },
                            "score_mode": "avg",
                        }
                    }
                }
            ],
            "filter": [{"exists": {"field": "resource_type"}}],
        }
    }
    query_str = json.dumps(percolate_query)
    assert "has_child" in query_str
    query = remove_child_queries(percolate_query)
    query_str = json.dumps(query)
    assert "has_child" not in query_str


def test_deindex_percolate_query(mocker):
    """Test that deleting a percolate query removes it from the index"""
    mock_deindex = mocker.patch("learning_resources_search.indexing_api.deindex_items")
    og_query = {"test1": "test1"}
    query = PercolateQueryFactory.create(original_query=og_query, query=og_query)
    assert PercolateQuery.objects.count() == 1
    deindex_percolators([query.id])
    mock_deindex.assert_called_once()


def test_index_percolate_query(mocker):
    """Test that adding a percolate query adds it to the OpenSearch index"""

    mock_index_percolators = mocker.patch(
        "learning_resources_search.indexing_api.index_percolators", autospec=True
    )
    query = PercolateQueryFactory.create(
        original_query={"test": "test"}, query={"test": "test"}
    )
    mock_index_percolators(
        [query.id],
        IndexestoUpdate.current_index.value,
    )

    mock_index_percolators.assert_any_call(
        [query.id], IndexestoUpdate.current_index.value
    )


@pytest.mark.parametrize("object_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_update_document_with_partial(mocked_es, mocker, object_type):
    """
    Test that update_document_with_partial gets a connection and calls the correct opensearch-dsl function
    """
    mock_get_aliases = mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        return_value=[object_type],
    )
    doc_id, data = ("doc_id", {"key1": "value1"})
    update_document_with_partial(doc_id, data, object_type)
    mock_get_aliases.assert_called_once_with(mocked_es.conn, object_types=[object_type])
    mocked_es.get_conn.assert_called_once_with()
    mocked_es.conn.update.assert_called_once_with(
        index=object_type,
        body={"doc": data},
        id=doc_id,
        params={"retry_on_conflict": 0},
    )


def test_update_partial_conflict_logging(mocker, mocked_es):
    """
    Test that update_document_with_partial logs an error if a version conflict occurs
    """
    patched_logger = mocker.patch("learning_resources_search.indexing_api.log")
    doc_id, data = ("doc_id", {"key1": "value1", "object_type": COURSE_TYPE})
    mocked_es.conn.update.side_effect = ConflictError
    update_document_with_partial(doc_id, data, COURSE_TYPE)
    assert patched_logger.error.called is True


@pytest.mark.parametrize("clear_all_greater_than", [True, False])
def test_clear_featured_rank(mocked_es, mocker, clear_all_greater_than):
    """
    Test that clear_featured_rank makest the correct opensearch-dsl call
    """
    mock_get_aliases = mocker.patch(
        "learning_resources_search.indexing_api.get_active_aliases",
        return_value=["index"],
    )
    if clear_all_greater_than:
        query = {
            "range": {
                "featured_rank": {
                    "gte": 3,
                }
            }
        }
    else:
        query = {
            "range": {
                "featured_rank": {
                    "gte": 3,
                    "lt": 4,
                }
            }
        }

    clear_featured_rank(3, clear_all_greater_than)
    mock_get_aliases.assert_called_once_with(mocked_es.conn)
    mocked_es.get_conn.assert_called_once_with()
    mocked_es.conn.update_by_query.assert_called_once_with(
        index="index",
        conflicts="proceed",
        body={
            "script": {
                "source": "ctx._source.featured_rank = params.newValue",
                "lang": "painless",
                "params": {"newValue": None},
            },
            "query": query,
        },
    )
