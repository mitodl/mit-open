"""
Tests for the indexing API
"""

# pylint: disable=redefined-outer-name
from types import SimpleNamespace

import pytest
from opensearchpy.exceptions import NotFoundError

from learning_resources_search import indexing_api
from learning_resources_search.connection import get_default_alias_name
from learning_resources_search.constants import (
    ALIAS_ALL_INDICES,
    COURSE_TYPE,
    GLOBAL_DOC_TYPE,
    PROGRAM_TYPE,
    IndexestoUpdate,
)
from learning_resources_search.exceptions import ReindexError
from learning_resources_search.indexing_api import (
    clear_and_create_index,
    create_backing_index,
    deindex_document,
    delete_orphaned_indices,
    get_reindexing_alias_name,
    index_items,
    switch_indices,
)
from open_discussions.utils import chunks

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("mocked_es")]


@pytest.fixture()
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


@pytest.mark.usefixtures("indexing_user")
@pytest.mark.parametrize("errors", [(), "error"])
@pytest.mark.parametrize(
    ("indexing_func_name", "serializing_func_name", "object_type"),
    [
        ("index_courses", "serialize_bulk_courses", "course"),
        ("index_programs", "serialize_bulk_programs", "program"),
    ],
)
@pytest.mark.parametrize(
    "index_types",
    [
        IndexestoUpdate.current_index.value,
        IndexestoUpdate.reindexing_index.value,
        IndexestoUpdate.all_indexes.value,
    ],
)
def test_index_functions(  # noqa: PLR0913
    mocked_es,
    mocker,
    settings,
    errors,
    indexing_func_name,
    serializing_func_name,
    object_type,
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
        f"learning_resources_search.indexing_api.{serializing_func_name}",
        autospec=True,
        return_value=(doc for doc in documents),
    )
    bulk_mock = mocker.patch(
        "learning_resources_search.indexing_api.bulk",
        autospec=True,
        return_value=(0, errors),
    )
    index_func = getattr(indexing_api, indexing_func_name)

    if errors:
        with pytest.raises(ReindexError):
            index_func([1, 2, 3], index_types)
    else:
        index_func([1, 2, 3], index_types)
        mock_get_aliases.assert_called_with(
            mocked_es.conn,
            object_types=[object_type],
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
                    doc_type=GLOBAL_DOC_TYPE,
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                )


@pytest.mark.usefixtures("indexing_user")
@pytest.mark.parametrize("errors", [(), "error"])
@pytest.mark.parametrize(
    ("indexing_func_name", "serializing_func_name", "object_type"),
    [
        ("deindex_programs", "serialize_bulk_programs_for_deletion", "program"),
        ("deindex_courses", "serialize_bulk_courses_for_deletion", "course"),
    ],
)
def test_bulk_deindex_functions(  # noqa: PLR0913
    mocked_es,
    mocker,
    settings,
    errors,
    indexing_func_name,
    serializing_func_name,
    object_type,
):
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
        f"learning_resources_search.indexing_api.{serializing_func_name}",
        autospec=True,
        return_value=(doc for doc in documents),
    )
    bulk_mock = mocker.patch(
        "learning_resources_search.indexing_api.bulk",
        autospec=True,
        return_value=(0, errors),
    )
    index_func = getattr(indexing_api, indexing_func_name)

    if errors:
        with pytest.raises(ReindexError):
            index_func([1, 2, 3])
    else:
        index_func([1, 2, 3])
        mock_get_aliases.assert_called_with(
            mocked_es.conn,
            object_types=[object_type],
            index_types=IndexestoUpdate.current_index.value,
        )

        for alias in mock_get_aliases.return_value:
            for chunk in chunks(
                documents, chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE
            ):
                bulk_mock.assert_any_call(
                    mocked_es.conn,
                    chunk,
                    index=alias,
                    doc_type=GLOBAL_DOC_TYPE,
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
    mocked_es.conn.delete.assert_called_with(
        index="a", doc_type=GLOBAL_DOC_TYPE, id=1, params={}
    )


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


def test_delete_orphaned_indices(mocker, mocked_es):
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
    delete_orphaned_indices()
    mocked_es.conn.indices.get_alias.assert_called_once_with(index="*")
    mocked_es.conn.indices.delete_alias.assert_any_call(
        name="discussions_local_program_reindexing",
        index="discussions_local_program_b8c9b1e61d15ff354f6884bba05484cb",
    )
    mocked_es.conn.indices.delete_alias.assert_any_call(
        name="discussions_local_program_reindexing",
        index="discussions_local_program_1e61d15ff35b8c9b4f6884bba05484cb",
    )
    mocked_es.conn.indices.delete.assert_any_call(
        "discussions_local_program_5484cbb8c9b1e61d15ff354f6884bba0"
    )
    mocked_es.conn.indices.delete.assert_any_call(
        "discussions_local_program_b8c9b1e61d15ff354f6884bba05484cb"
    )
    assert mocked_es.conn.indices.delete.call_count == 2
