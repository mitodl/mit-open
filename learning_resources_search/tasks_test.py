"""Search task tests"""
# pylint: disable=redefined-outer-name,unused-argument

import pytest
from celery.exceptions import Retry
from django.conf import settings
from opensearchpy.exceptions import ConnectionError as ESConnectionError
from opensearchpy.exceptions import ConnectionTimeout, RequestError

from learning_resources.constants import PlatformType
from learning_resources.factories import (
    CourseFactory,
    LearningResourcePlatformFactory,
    ProgramFactory,
)
from learning_resources.models import LearningResourcePlatform
from learning_resources.serializers import LearningResourceSerializer
from learning_resources_search import tasks
from learning_resources_search.constants import (
    COURSE_TYPE,
    PROGRAM_TYPE,
    VALID_OBJECT_TYPES,
    IndexestoUpdate,
)
from learning_resources_search.exceptions import ReindexError, RetryError
from learning_resources_search.tasks import (
    deindex_document,
    finish_recreate_index,
    index_courses,
    start_recreate_index,
    start_update_index,
    upsert_course,
    upsert_program,
    wrap_retry_exception,
)
from open_discussions.test_utils import assert_not_raises

pytestmark = pytest.mark.django_db


@pytest.fixture()
def _wrap_retry_mock(mocker):
    """
    Patches the wrap_retry_exception context manager and asserts that it was
    called by any test that uses it
    """
    wrap_mock = mocker.patch("learning_resources_search.tasks.wrap_retry_exception")
    yield
    wrap_mock.assert_called_once()


@pytest.fixture()
def mocked_api(mocker):
    """Mock object that patches the channels API"""
    return mocker.patch("learning_resources_search.tasks.api")


def test_upsert_course_task(mocked_api):
    """Test that upsert_course will serialize the course data and upsert it to the ES index"""
    course = CourseFactory.create()
    upsert_course(course.learning_resource_id)
    data = LearningResourceSerializer(course.learning_resource).data
    mocked_api.upsert_document.assert_called_once_with(
        course.learning_resource.id,
        data,
        COURSE_TYPE,
        retry_on_conflict=settings.INDEXING_ERROR_RETRIES,
    )


def test_upsert_program_task(mocked_api):
    """Test that upsert_program will serialize the video data and upsert it to the ES index"""
    program = ProgramFactory.create()
    upsert_program(program)
    data = LearningResourceSerializer(program.learning_resource).data
    mocked_api.upsert_document.assert_called_once_with(
        program.learning_resource.id,
        data,
        PROGRAM_TYPE,
        retry_on_conflict=settings.INDEXING_ERROR_RETRIES,
    )


@pytest.mark.parametrize("error", [KeyError, RequestError])
def test_wrap_retry_exception(error):
    """wrap_retry_exception should raise RetryError when other exceptions are raised"""
    with assert_not_raises(), wrap_retry_exception(error):
        # Should not raise an exception
        pass


@pytest.mark.parametrize("matching", [True, False])
def test_wrap_retry_exception_matching(matching):
    """A matching exception should raise a RetryError"""

    def raise_thing():
        """Raise the exception"""
        if matching:
            msg = "err"
            raise ConnectionTimeout(msg, "err", "err")
        else:
            raise TabError

    matching_exception = RetryError if matching else TabError
    with pytest.raises(matching_exception), wrap_retry_exception(ESConnectionError):
        raise_thing()


@pytest.mark.parametrize(
    "indexes",
    [["course"], ["program"]],
)
def test_start_recreate_index(
    mocker, mocked_celery, user, indexes
):  # pylint:disable=too-many-locals,too-many-statements,too-many-branches
    """
    recreate_index should recreate the OpenSearch index and reindex all data with it
    """
    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 2
    mock_blocklist = mocker.patch(
        "learning_resources_search.tasks.load_course_blocklist", return_value=[]
    )

    if COURSE_TYPE in indexes:
        courses = sorted(
            CourseFactory.create_batch(6),
            key=lambda course: course.learning_resource_id,
        )
    else:
        programs = sorted(
            ProgramFactory.create_batch(4),
            key=lambda program: program.learning_resource_id,
        )

    index_courses_mock = mocker.patch(
        "learning_resources_search.tasks.index_courses", autospec=True
    )
    index_programs_mock = mocker.patch(
        "learning_resources_search.tasks.index_programs", autospec=True
    )

    backing_index = "backing"
    create_backing_index_mock = mocker.patch(
        "learning_resources_search.indexing_api.create_backing_index",
        autospec=True,
        return_value=backing_index,
    )
    finish_recreate_index_mock = mocker.patch(
        "learning_resources_search.tasks.finish_recreate_index", autospec=True
    )

    with pytest.raises(mocked_celery.replace_exception_class):
        start_recreate_index.delay(indexes)

    finish_recreate_index_dict = {}

    for doctype in VALID_OBJECT_TYPES:
        if doctype in indexes:
            finish_recreate_index_dict[doctype] = backing_index
            create_backing_index_mock.assert_any_call(doctype)

    finish_recreate_index_mock.s.assert_called_once_with(finish_recreate_index_dict)
    assert mocked_celery.group.call_count == 1

    # Celery's 'group' function takes a generator as an argument. In order to make assertions about the items
    # in that generator, 'list' is being called to force iteration through all of those items.
    list(mocked_celery.group.call_args[0][0])

    if COURSE_TYPE in indexes:
        mock_blocklist.assert_called_once()
        assert index_courses_mock.si.call_count == 3
        index_courses_mock.si.assert_any_call(
            [courses[0].learning_resource_id, courses[1].learning_resource_id],
            index_types=IndexestoUpdate.reindexing_index.value,
        )
        index_courses_mock.si.assert_any_call(
            [courses[2].learning_resource_id, courses[3].learning_resource_id],
            index_types=IndexestoUpdate.reindexing_index.value,
        )
        index_courses_mock.si.assert_any_call(
            [courses[4].learning_resource_id, courses[5].learning_resource_id],
            index_types=IndexestoUpdate.reindexing_index.value,
        )

    if PROGRAM_TYPE in indexes:
        assert index_programs_mock.si.call_count == 2
        index_programs_mock.si.assert_any_call(
            [programs[0].learning_resource_id, programs[1].learning_resource_id],
            index_types=IndexestoUpdate.reindexing_index.value,
        )
        index_programs_mock.si.assert_any_call(
            [programs[2].learning_resource_id, programs[3].learning_resource_id],
            index_types=IndexestoUpdate.reindexing_index.value,
        )

    assert mocked_celery.replace.call_count == 1
    assert mocked_celery.replace.call_args[0][1] == mocked_celery.chain.return_value


@pytest.mark.parametrize("with_error", [True, False])
def test_finish_recreate_index(mocker, with_error):
    """
    finish_recreate_index should attach the backing index to the default alias
    """
    backing_indices = {"course": "backing", "program": "backing"}
    results = ["error"] if with_error else []
    switch_indices_mock = mocker.patch(
        "learning_resources_search.indexing_api.switch_indices", autospec=True
    )
    mock_delete_orphans = mocker.patch(
        "learning_resources_search.indexing_api.delete_orphaned_indices"
    )

    if with_error:
        with pytest.raises(ReindexError):
            finish_recreate_index.delay(results, backing_indices)
        switch_indices_mock.assert_not_called()
        mock_delete_orphans.assert_called_once()
    else:
        finish_recreate_index.delay(results, backing_indices)
        switch_indices_mock.assert_any_call("backing", COURSE_TYPE)
        switch_indices_mock.assert_any_call("backing", PROGRAM_TYPE)
        mock_delete_orphans.assert_not_called()


@pytest.mark.parametrize("with_error", [True, False])
def test_finish_recreate_index_retry_exceptions(mocker, with_error):
    """
    finish_recreate_index should be retried on RequestErrors
    """
    backing_indices = {"course": "backing", "program": "backing"}
    results = ["error"] if with_error else []
    mock_error = RequestError(429, "oops", {})
    switch_indices_mock = mocker.patch(
        "learning_resources_search.indexing_api.switch_indices",
        autospec=True,
        side_effect=[mock_error, None],
    )
    mock_delete_orphans = mocker.patch(
        "learning_resources_search.indexing_api.delete_orphaned_indices",
        side_effect=[mock_error, None],
    )

    with pytest.raises(Retry):
        finish_recreate_index.delay(results, backing_indices)
    if with_error:
        switch_indices_mock.assert_not_called()
        mock_delete_orphans.assert_called_once()
    else:
        mock_delete_orphans.assert_not_called()
        switch_indices_mock.assert_called_once()


@pytest.mark.usefixtures("_wrap_retry_mock")
@pytest.mark.parametrize("with_error", [True, False])
@pytest.mark.parametrize(
    "index_types",
    [
        IndexestoUpdate.current_index.value,
        IndexestoUpdate.reindexing_index.value,
        IndexestoUpdate.all_indexes.value,
    ],
)
def test_index_courses(mocker, with_error, index_types):
    """index_courses should call the api function of the same name"""
    index_courses_mock = mocker.patch(
        "learning_resources_search.indexing_api.index_courses"
    )
    if with_error:
        index_courses_mock.side_effect = TabError
    result = index_courses.delay([1, 2, 3], index_types).get()
    assert result == ("index_courses threw an error" if with_error else None)

    index_courses_mock.assert_called_once_with([1, 2, 3], index_types)


def test_deindex_document(mocker):
    """deindex_document should call the api function of the same name"""
    deindex_document_mock = mocker.patch(
        "learning_resources_search.indexing_api.deindex_document"
    )
    deindex_document.delay(1, "course").get()
    deindex_document_mock.assert_called_once_with(1, "course")


@pytest.mark.usefixtures("_wrap_retry_mock")
@pytest.mark.parametrize("with_error", [True, False])
@pytest.mark.parametrize(
    ("tasks_func_name", "indexing_func_name"),
    [
        ("bulk_deindex_courses", "deindex_courses"),
        ("bulk_deindex_programs", "deindex_programs"),
    ],
)
def test_bulk_deletion_tasks(mocker, with_error, tasks_func_name, indexing_func_name):
    """Bulk deletion tasks should call corresponding indexing api function"""
    indexing_api_task_mock = mocker.patch(
        f"learning_resources_search.indexing_api.{indexing_func_name}"
    )

    task = getattr(tasks, tasks_func_name)

    if with_error:
        indexing_api_task_mock.side_effect = TabError
    result = task.delay([1]).get()
    assert result == (f"{tasks_func_name} threw an error" if with_error else None)

    indexing_api_task_mock.assert_called_once_with([1])


@pytest.mark.parametrize(
    ("indexes", "platform"),
    [
        (
            [
                "program",
            ],
            None,
        ),
        (["course"], None),
        (["course"], PlatformType.xpro.value),
    ],
)
def test_start_update_index(
    mocker, mocked_celery, indexes, platform, settings
):  # pylint:disable=too-many-locals,too-many-statements,too-many-branches
    """
    recreate_index should recreate the OpenSearch index and reindex all data with it
    """

    settings.OPENSEARCH_INDEXING_CHUNK_SIZE = 2
    mock_blocklist = mocker.patch(
        "learning_resources_search.tasks.load_course_blocklist", return_value=[]
    )

    platforms = [
        PlatformType.ocw,
        PlatformType.edx,
        PlatformType.xpro,
        PlatformType.mitxonline,
    ]

    if COURSE_TYPE in indexes:
        courses = sorted(
            [
                CourseFactory.create(
                    platform=LearningResourcePlatformFactory.create(
                        platform=platform.value
                    )
                )
                for platform in platforms
            ],
            key=lambda course: course.learning_resource_id,
        )

        unpublished_courses = sorted(
            [
                CourseFactory.create(
                    platform=LearningResourcePlatform.objects.get(
                        platform=platform.value
                    ),
                    is_unpublished=True,
                )
                for platform in platforms
            ],
            key=lambda course: course.learning_resource_id,
        )
    else:
        programs = sorted(
            ProgramFactory.create_batch(4),
            key=lambda program: program.learning_resource_id,
        )
        unpublished_program = ProgramFactory.create(is_unpublished=True)

    index_courses_mock = mocker.patch(
        "learning_resources_search.tasks.index_courses", autospec=True
    )
    deindex_courses_mock = mocker.patch(
        "learning_resources_search.tasks.bulk_deindex_courses", autospec=True
    )

    index_programs_mock = mocker.patch(
        "learning_resources_search.tasks.index_programs", autospec=True
    )
    deindex_programs_mock = mocker.patch(
        "learning_resources_search.tasks.bulk_deindex_programs", autospec=True
    )

    with pytest.raises(mocked_celery.replace_exception_class):
        start_update_index.delay(indexes, platform)

    assert mocked_celery.group.call_count == 1

    # Celery's 'group' function takes a generator as an argument. In order to make assertions about the items
    # in that generator, 'list' is being called to force iteration through all of those items.
    list(mocked_celery.group.call_args[0][0])

    if COURSE_TYPE in indexes:
        mock_blocklist.assert_called_once()

        if platform:
            assert index_courses_mock.si.call_count == 1
            course = next(
                course
                for course in courses
                if course.learning_resource.platform.platform == platform
            )
            index_courses_mock.si.assert_any_call(
                [course.learning_resource_id],
                index_types=IndexestoUpdate.current_index.value,
            )

            assert deindex_courses_mock.si.call_count == 1
            unpublished_course = next(
                course
                for course in unpublished_courses
                if course.learning_resource.platform.platform == platform
            )
            deindex_courses_mock.si.assert_any_call(
                [unpublished_course.learning_resource_id]
            )
        else:
            assert index_courses_mock.si.call_count == 2
            index_courses_mock.si.assert_any_call(
                [courses[0].learning_resource_id, courses[1].learning_resource_id],
                index_types=IndexestoUpdate.current_index.value,
            )
            index_courses_mock.si.assert_any_call(
                [courses[2].learning_resource_id, courses[3].learning_resource_id],
                index_types=IndexestoUpdate.current_index.value,
            )

            assert deindex_courses_mock.si.call_count == 2
            deindex_courses_mock.si.assert_any_call(
                [
                    unpublished_courses[0].learning_resource_id,
                    unpublished_courses[1].learning_resource_id,
                ]
            )
            deindex_courses_mock.si.assert_any_call(
                [
                    unpublished_courses[2].learning_resource_id,
                    unpublished_courses[3].learning_resource_id,
                ]
            )

    if PROGRAM_TYPE in indexes:
        assert index_programs_mock.si.call_count == 2
        index_programs_mock.si.assert_any_call(
            [programs[0].learning_resource_id, programs[1].learning_resource_id],
            index_types=IndexestoUpdate.current_index.value,
        )
        index_programs_mock.si.assert_any_call(
            [programs[2].learning_resource_id, programs[3].learning_resource_id],
            index_types=IndexestoUpdate.current_index.value,
        )

        assert deindex_programs_mock.si.call_count == 1
        deindex_programs_mock.si.assert_any_call(
            [unpublished_program.learning_resource_id]
        )

    assert mocked_celery.replace.call_count == 1
    assert mocked_celery.replace.call_args[0][1] == mocked_celery.group.return_value
