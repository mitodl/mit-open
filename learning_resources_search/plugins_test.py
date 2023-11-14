"""Tests for learning_resources_search plugins"""
import pytest

from learning_resources.factories import (
    LearningResourceFactory,
    LearningResourceRunFactory,
)
from learning_resources_search.constants import COURSE_TYPE, PROGRAM_TYPE
from learning_resources_search.plugins import SearchIndexPlugin


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_upsert_resource(mocker, resource_type):
    """The plugin function to upsert a resource to the search index should be triggered"""
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


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_remove_resource(mocker, resource_type):
    """The plugin function to remove a resource from the search index should be triggered"""
    mock_remove_course = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.deindex_course"
    )
    mock_remove_program = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.deindex_program"
    )
    resource = LearningResourceFactory.create(resource_type=resource_type)
    SearchIndexPlugin().resource_removed(resource)
    if resource_type == COURSE_TYPE:
        mock_remove_course.assert_called_once_with(resource)
        mock_remove_program.assert_not_called()
    else:
        mock_remove_program.assert_called_once_with(resource)
        mock_remove_course.assert_not_called()


@pytest.mark.django_db()
def test_search_index_plugin_upsert_run(mocker):
    """The plugin function to upsert a run's contenfiles to the search index should be triggered"""
    mock_upsert_contentfile = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.index_run_content_files"
    )
    run = LearningResourceRunFactory.create()
    SearchIndexPlugin().run_upserted(run)
    mock_upsert_contentfile.assert_called_once_with(run.id)


@pytest.mark.django_db()
def test_search_index_plugin_remove_run(mocker):
    """The plugin function to remove a run's contenfile to the search index should be triggered"""
    mock_upsert_contentfile = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.deindex_run_content_files"
    )
    run = LearningResourceRunFactory.create()
    SearchIndexPlugin().run_removed(run)
    mock_upsert_contentfile.assert_called_once_with(run.id, unpublished_only=False)
