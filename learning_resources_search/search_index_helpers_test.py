"""Task helper tests"""
# pylint: disable=redefined-outer-name,unused-argument
import pytest

from learning_resources.factories import (
    CourseFactory,
    ProgramFactory,
)
from learning_resources_search.api import (
    gen_course_id,
)
from learning_resources_search.constants import (
    COURSE_TYPE,
)
from learning_resources_search.search_index_helpers import (
    deindex_course,
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

    course = CourseFactory.create()
    course_es_id = gen_course_id(
        course.learning_resource.platform, course.learning_resource.readable_id
    )

    deindex_course(course.learning_resource)
    mock_del_document.assert_called_once_with(course_es_id, COURSE_TYPE)


@pytest.mark.django_db()
def test_upsert_program(mocker):
    """
    Tests that upsert_program calls update_field_values_by_query with the right parameters
    """
    patched_task = mocker.patch("learning_resources_search.tasks.upsert_program")
    program = ProgramFactory.create()
    upsert_program(program.learning_resource_id)
    patched_task.assert_called_once_with(program.learning_resource_id)
