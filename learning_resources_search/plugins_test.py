"""Tests for learning_resources_search plugins"""
import pytest

from learning_resources.factories import LearningResourceFactory
from learning_resources_search.constants import COURSE_TYPE, PROGRAM_TYPE
from learning_resources_search.plugins import SearchIndexPlugin


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_upsert(mocker, resource_type):
    """A UserList with title favorites should be created if it doesn't exist"""
    mock_upsert_course = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.upsert_course"
    )
    mock_upsert_program = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.upsert_program"
    )
    resource = LearningResourceFactory.create(resource_type=resource_type)
    SearchIndexPlugin().resource_upserted(resource)
    if resource_type == COURSE_TYPE:
        mock_upsert_course.assert_called_once_with(resource.id)
        mock_upsert_program.assert_not_called()
    else:
        mock_upsert_program.assert_called_once_with(resource.id)
        mock_upsert_course.assert_not_called()
