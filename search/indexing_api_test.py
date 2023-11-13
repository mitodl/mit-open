"""
Tests for the indexing API
"""

# pylint: disable=redefined-outer-name
from types import SimpleNamespace

import pytest
from opensearchpy.exceptions import NotFoundError

from course_catalog.factories import (
    ContentFileFactory,
    CourseFactory,
    LearningResourceRunFactory,
)
from course_catalog.models import ContentFile
from open_discussions.factories import UserFactory
from open_discussions.utils import chunks
from search import indexing_api
from search.api import gen_course_id
from search.connection import get_default_alias_name
from search.constants import (
    COURSE_TYPE,
    GLOBAL_DOC_TYPE,
    PROFILE_TYPE,
    SCRIPTING_LANG,
    UPDATE_CONFLICT_SETTING,
)
from search.exceptions import ReindexException
from search.indexing_api import (
    clear_and_create_index,
    deindex_courses,
    deindex_document,
    deindex_run_content_files,
    delete_orphaned_indices,
    get_reindexing_alias_name,
    index_course_content_files,
    index_items,
    index_run_content_files,
    update_field_values_by_query,
)
from search.serializers import serialize_bulk_profiles

pytestmark = [pytest.mark.django_db, pytest.mark.usefixtures("mocked_es")]


@pytest.fixture()
def mocked_es(mocker, settings):
    """Mocked ES client objects/functions"""  # noqa: D401
    index_name = "test"
    settings.OPENSEARCH_INDEX = index_name
    conn = mocker.Mock()
    get_conn_patch = mocker.patch(
        "search.indexing_api.get_conn", autospec=True, return_value=conn
    )
    mocker.patch("search.connection.get_conn", autospec=True)
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


@pytest.mark.parametrize(
    ("version_conflicts", "expected_error_logged"), [(0, False), (1, True)]
)
def test_update_field_values_by_query(
    mocker, mocked_es, version_conflicts, expected_error_logged
):
    """
    Tests that update_field_values_by_query gets a connection, calls the correct opensearch-dsl function,
    and logs an error if the results indicate version conflicts
    """
    patched_logger = mocker.patch("search.indexing_api.log")
    query, field_name, field_value = ({"query": None}, "field1", "value1")
    new_value_param = f"new_value_{field_name}"
    mocked_es.conn.update_by_query.return_value = {
        "version_conflicts": version_conflicts
    }
    update_field_values_by_query(query, {field_name: field_value})

    mocked_es.get_conn.assert_called_once_with()
    for alias in mocked_es.active_aliases:
        mocked_es.conn.update_by_query.assert_any_call(
            index=alias,
            doc_type=GLOBAL_DOC_TYPE,
            conflicts=UPDATE_CONFLICT_SETTING,
            body={
                "script": {
                    "source": f"ctx._source['{field_name}'] = params.{new_value_param}",
                    "lang": SCRIPTING_LANG,
                    "params": {new_value_param: field_value},
                },
                **query,
            },
        )
    assert patched_logger.error.called is expected_error_logged


@pytest.mark.parametrize("object_type", [None, "fake"])
def test_clear_and_create_index_error(object_type):
    """
    clear_and_create_index should raise a TypeError if object_type is None or invalid
    """
    with pytest.raises(ValueError):  # noqa: PT011
        clear_and_create_index(
            index_name="idx", skip_mapping=False, object_type=object_type
        )


@pytest.mark.usefixtures("indexing_user")
@pytest.mark.parametrize("errors", ([], ["error"]))  # noqa: PT007
@pytest.mark.parametrize(
    ("indexing_func_name", "serializing_func_name", "object_type"),
    [
        ("index_profiles", "serialize_bulk_profiles", "profile"),
        ("index_courses", "serialize_bulk_courses", "course"),
        ("index_programs", "serialize_bulk_programs", "program"),
        ("index_user_lists", "serialize_bulk_user_lists", "userlist"),
        ("index_videos", "serialize_bulk_videos", "video"),
        ("index_podcasts", "serialize_bulk_podcasts", "podcast"),
        ("index_podcast_episodes", "serialize_bulk_podcast_episodes", "podcastepisode"),
    ],
)
@pytest.mark.parametrize("update_only", (True, False))  # noqa: PT007
def test_index_functions(  # noqa: PLR0913
    mocked_es,
    mocker,
    settings,
    errors,
    indexing_func_name,
    serializing_func_name,
    object_type,
    update_only,
):  # pylint: disable=too-many-arguments
    """
    index functions should call bulk with correct arguments
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 3
    documents = ["doc1", "doc2", "doc3", "doc4", "doc5"]
    mock_get_aliases = mocker.patch(
        "search.indexing_api.get_active_aliases", autospec=True, return_value=["a", "b"]
    )
    mocker.patch(
        f"search.indexing_api.{serializing_func_name}",
        autospec=True,
        return_value=(doc for doc in documents),
    )
    bulk_mock = mocker.patch(
        "search.indexing_api.bulk", autospec=True, return_value=(0, errors)
    )
    index_func = getattr(indexing_api, indexing_func_name)

    if errors:
        with pytest.raises(ReindexException):
            index_func([1, 2, 3], update_only)
    else:
        index_func([1, 2, 3], update_only)
        mock_get_aliases.assert_called_with(
            mocked_es.conn,
            object_types=[object_type],
            include_reindexing=(not update_only),
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
@pytest.mark.parametrize("errors", ([], ["error"]))  # noqa: PT007
@pytest.mark.parametrize(
    ("indexing_func_name", "serializing_func_name", "object_type"),
    [
        ("deindex_profiles", "serialize_bulk_profiles_for_deletion", "profile"),
        ("deindex_programs", "serialize_bulk_programs_for_deletion", "program"),
        ("deindex_user_lists", "serialize_bulk_user_lists_for_deletion", "userlist"),
        ("deindex_podcasts", "serialize_bulk_podcasts_for_deletion", "podcast"),
        (
            "deindex_podcast_episodes",
            "serialize_bulk_podcast_episodes_for_deletion",
            "podcastepisode",
        ),
        ("deindex_videos", "serialize_bulk_videos_for_deletion", "video"),
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
):  # pylint: disable=too-many-arguments
    """
    Deindex functions should call bulk with correct arguments
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 3
    documents = ["doc1", "doc2", "doc3", "doc4", "doc5"]
    mock_get_aliases = mocker.patch(
        "search.indexing_api.get_active_aliases", autospec=True, return_value=["a", "b"]
    )
    mocker.patch(
        f"search.indexing_api.{serializing_func_name}",
        autospec=True,
        return_value=(doc for doc in documents),
    )
    bulk_mock = mocker.patch(
        "search.indexing_api.bulk", autospec=True, return_value=(0, errors)
    )
    index_func = getattr(indexing_api, indexing_func_name)

    if errors:
        with pytest.raises(ReindexException):
            index_func([1, 2, 3])
    else:
        index_func([1, 2, 3])
        mock_get_aliases.assert_called_with(
            mocked_es.conn, object_types=[object_type], include_reindexing=False
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
def test_bulk_content_file_deindex_on_course_deletion(mocker):
    """
    ES should deindex content files on bulk  course deletion
    """
    mock_deindex_run_content_files = mocker.patch(
        "search.indexing_api.deindex_run_content_files", autospec=True
    )
    mocker.patch("search.indexing_api.deindex_items", autospec=True)

    courses = CourseFactory.create_batch(2)
    deindex_courses([course.id for course in courses])
    for course in courses:
        for run in course.runs.all():
            mock_deindex_run_content_files.assert_any_call(run.id)


def test_deindex_run_content_files(mocker):
    """deindex_run_content_files should remove them from index and db"""
    mock_deindex = mocker.patch("search.indexing_api.deindex_items")
    run = LearningResourceRunFactory.create(published=True)
    ContentFileFactory.create_batch(3, run=run, published=True)
    assert ContentFile.objects.count() == 3
    deindex_run_content_files(run.id)
    mock_deindex.assert_called_once()
    assert ContentFile.objects.count() == 0


def test_deindex_document(mocked_es, mocker):
    """
    ES should try removing the specified document from the correct index
    """
    mocker.patch(
        "search.indexing_api.get_active_aliases", autospec=True, return_value=["a"]
    )
    deindex_document(1, "course")
    mocked_es.conn.delete.assert_called_with(
        index="a", doc_type=GLOBAL_DOC_TYPE, id=1, params={}
    )


def test_deindex_document_not_found(mocked_es, mocker):
    """
    ES should try removing the specified document from the correct index
    """
    patched_logger = mocker.patch("search.indexing_api.log")
    mocker.patch(
        "search.indexing_api.get_active_aliases", autospec=True, return_value=["a"]
    )
    mocked_es.conn.delete.side_effect = NotFoundError
    deindex_document(1, "course")
    assert patched_logger.debug.called is True


@pytest.mark.parametrize("update_only", (False, True))  # noqa: PT007
def test_index_content_files(mocker, update_only):
    """
    ES should try indexing content files for all runs in a course
    """
    mock_index_run_content_files = mocker.patch(
        "search.indexing_api.index_run_content_files", autospec=True
    )
    courses = CourseFactory.create_batch(2)
    index_course_content_files([course.id for course in courses], update_only)
    for course in courses:
        for run in course.runs.all():
            mock_index_run_content_files.assert_any_call(run.id, update_only)


@pytest.mark.parametrize(("max_size", "chunks"), [[10000, 2], [500, 4]])  # noqa: PT007
@pytest.mark.parametrize("exceeds_size", [True, False])
def test_index_items_size_limits(settings, mocker, max_size, chunks, exceeds_size):
    """
    Chunks should get split into smaller chunks if necessary, log error if single-file chunks too big
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 5
    settings.OPENSEARCH_MAX_REQUEST_SIZE = max_size
    mock_aliases = mocker.patch(
        "search.indexing_api.get_active_aliases", autospec=True, return_value=[]
    )
    mock_log = mocker.patch("search.indexing_api.log.error")
    documents = [
        {"_id": 1, "content": "a" * (max_size if exceeds_size else 100)}
        for _ in range(10)
    ]
    index_items(documents, "course", update_only=True)
    assert mock_aliases.call_count == (chunks if not exceeds_size else 0)
    assert mock_log.call_count == (10 if exceeds_size else 0)


def test_index_profile_items(mocker):
    """
    index_items for profiles should call alias and bulk index functions
    """
    users = UserFactory.create_batch(2)
    profile_ids = [user.profile.id for user in users]

    mock_aliases = mocker.patch(
        "search.indexing_api.get_active_aliases",
        autospec=True,
        return_value=["default"],
    )
    mock_bulk = mocker.patch(
        "search.indexing_api.bulk", autospec=True, return_value=[None, []]
    )
    index_items(
        serialize_bulk_profiles(profile_ids),
        PROFILE_TYPE,
        False,  # noqa: FBT003
    )  # noqa: FBT003, RUF100
    assert mock_aliases.call_count == 1
    assert mock_bulk.call_count == 1


@pytest.mark.usefixtures("indexing_user")
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
@pytest.mark.parametrize("errors", ([], ["error"]))  # noqa: PT007
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
):  # pylint: disable=too-many-arguments,too-many-locals
    """
    index functions for content files should call bulk with correct arguments
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = indexing_chunk_size
    settings.OPENSEARCH_DOCUMENT_INDEXING_CHUNK_SIZE = document_indexing_chunk_size
    course = CourseFactory.create()
    run = LearningResourceRunFactory.create(content_object=course)
    content_files = ContentFileFactory.create_batch(5, run=run, published=True)
    deindexd_content_file = ContentFileFactory.create_batch(5, run=run, published=False)
    mock_get_aliases = mocker.patch(
        "search.indexing_api.get_active_aliases", autospec=True, return_value=["a", "b"]
    )
    bulk_mock = mocker.patch(
        "search.indexing_api.bulk", autospec=True, return_value=(0, errors)
    )
    mocker.patch(
        "search.indexing_api.serialize_content_file_for_bulk",
        autospec=True,
        return_value=doc,
    )
    mocker.patch(
        "search.indexing_api.serialize_content_file_for_bulk_deletion",
        autospec=True,
        return_value=doc,
    )

    if indexing_func_name == "index_run_content_files":
        chunk_size = min(indexing_chunk_size, document_indexing_chunk_size)
    else:
        chunk_size = indexing_chunk_size

    if errors:
        index_func = getattr(indexing_api, indexing_func_name)

        with pytest.raises(ReindexException):
            index_func(run.id)
    else:
        if indexing_func_name == "index_run_content_files":
            index_run_content_files(run.id)
        else:
            deindex_run_content_files(run.id, unpublished_only)

        if unpublished_only:
            content_files = deindexd_content_file
        else:
            content_files = [*content_files, deindexd_content_file]

        for alias in mock_get_aliases.return_value:
            for chunk in chunks([doc for _ in content_files], chunk_size=chunk_size):
                bulk_mock.assert_any_call(
                    mocked_es.conn,
                    chunk,
                    index=alias,
                    doc_type=GLOBAL_DOC_TYPE,
                    chunk_size=settings.OPENSEARCH_INDEXING_CHUNK_SIZE,
                    routing=gen_course_id(course.platform, course.course_id),
                )


@pytest.mark.parametrize("has_files", [True, False])
def test_deindex_run_content_files_no_files(mocker, has_files):
    """deindex_run_content_files shouldn't do anything if there are no content files"""
    mock_deindex_items = mocker.patch("search.indexing_api.deindex_items")
    run = LearningResourceRunFactory.create(published=True)
    if has_files:
        ContentFileFactory.create(run=run, published=False)
    deindex_run_content_files(run.id, unpublished_only=True)
    assert mock_deindex_items.call_count == (1 if has_files else 0)


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
