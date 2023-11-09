"""Task helper tests"""

import pytest

from learning_resources.factories import (
    ContentFileFactory,
    CourseFactory,
    LearningResourceRunFactory,
    ProgramFactory,
)
from learning_resources_search.constants import (
    COURSE_TYPE,
)
from learning_resources_search.search_index_helpers import (
    deindex_course,
    deindex_run_content_files,
    index_run_content_files,
    upsert_content_file,
    upsert_course,
    upsert_program,
)


@pytest.mark.django_db()
def test_upsert_course(mocker):
    """
    Tests that upsert_course calls update_field_values_by_query with the right parameters
    """
    patched_task = mocker.patch("learning_resources_search.tasks.upsert_course")
    course = CourseFactory.create()
    upsert_course(course.learning_resource_id)
    patched_task.assert_called_once_with(course.learning_resource_id)


@pytest.mark.django_db()
def test_delete_course(mocker):
    """
    Tests that deindex_course calls the delete tasks for the course and its content files
    """
    mock_del_document = mocker.patch(
        "learning_resources_search.search_index_helpers.deindex_document"
    )
    mock_bulk_del = mocker.patch(
        "learning_resources_search.search_index_helpers.deindex_run_content_files"
    )
    course = CourseFactory.create()

    deindex_course(course.learning_resource)
    mock_del_document.assert_called_once_with(course.learning_resource.id, COURSE_TYPE)
    for run in course.learning_resource.runs.iterator():
        mock_bulk_del.assert_any_call(run.id, unpublished_only=False)


@pytest.mark.django_db()
def test_upsert_program(mocker):
    """
    Tests that upsert_program calls update_field_values_by_query with the right parameters
    """
    patched_task = mocker.patch("learning_resources_search.tasks.upsert_program")
    program = ProgramFactory.create()
    upsert_program(program.learning_resource_id)
    patched_task.assert_called_once_with(program.learning_resource_id)


@pytest.mark.django_db()
def test_upsert_content_file(mocker):
    """
    Tests that upsert_content_file calls the correct celery task with parameters
    """
    patched_task = mocker.patch("learning_resources_search.tasks.upsert_content_file")
    content_file = ContentFileFactory.create()
    upsert_content_file(content_file.id)
    patched_task.assert_called_once_with(content_file.id)


@pytest.mark.django_db()
def test_index_run_content_files(mocker):
    """
    Tests that index_run_content_files calls the correct celery task w/parameter
    """
    patched_task = mocker.patch(
        "learning_resources_search.tasks.index_run_content_files"
    )
    content_file = ContentFileFactory.create()
    index_run_content_files(content_file.id)
    patched_task.assert_called_once_with(content_file.id)


@pytest.mark.django_db()
@pytest.mark.parametrize("unpublished_only", [True, False])
def test_delete_run_content_files(mocker, unpublished_only):
    """Tests that deindex_run_content_files triggers the correct ES delete task"""
    patched_task = mocker.patch(
        "learning_resources_search.tasks.deindex_run_content_files"
    )
    run = LearningResourceRunFactory.create()
    deindex_run_content_files(run.id, unpublished_only=unpublished_only)
    patched_task.assert_called_once_with(run.id, unpublished_only)
