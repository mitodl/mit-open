"""Tests for learning_resources_search plugins"""
from types import SimpleNamespace

import pytest

from learning_resources.factories import (
    LearningResourceFactory,
    LearningResourceRunFactory,
)
from learning_resources.models import LearningResource, LearningResourceRun
from learning_resources_search.constants import COURSE_TYPE, PROGRAM_TYPE
from learning_resources_search.plugins import SearchIndexPlugin


@pytest.fixture()
def mock_search_index_helpers(mocker):
    """Mock the search index helpers"""
    mock_upsert_course = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.upsert_course"
    )
    mock_upsert_program = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.upsert_program"
    )
    mock_remove_course = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.deindex_course"
    )
    mock_remove_program = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.deindex_program"
    )
    mock_upsert_contentfiles = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.deindex_run_content_files"
    )
    mock_remove_contentfiles = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.deindex_run_content_files"
    )
    return SimpleNamespace(
        mock_upsert_course=mock_upsert_course,
        mock_upsert_program=mock_upsert_program,
        mock_remove_course=mock_remove_course,
        mock_remove_program=mock_remove_program,
        mock_upsert_contentfiles=mock_upsert_contentfiles,
        mock_remove_contentfiles=mock_remove_contentfiles,
    )


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_resource_upserted(
    mock_search_index_helpers, resource_type
):
    """The plugin function should upsert a resource to the search index"""
    resource = LearningResourceFactory.create(resource_type=resource_type)
    SearchIndexPlugin().resource_upserted(resource)
    if resource_type == COURSE_TYPE:
        mock_search_index_helpers.mock_upsert_course.assert_called_once_with(
            resource.id
        )
        mock_search_index_helpers.mock_upsert_program.assert_not_called()
    else:
        mock_search_index_helpers.mock_upsert_program.assert_called_once_with(
            resource.id
        )
        mock_search_index_helpers.mock_upsert_course.assert_not_called()


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_resource_unpublished(
    mock_search_index_helpers, resource_type
):
    """The plugin function should remove a resource from the search index"""
    resource = LearningResourceFactory.create(resource_type=resource_type)
    SearchIndexPlugin().resource_unpublished(resource)
    if resource_type == COURSE_TYPE:
        mock_search_index_helpers.mock_remove_course.assert_called_once_with(resource)
        mock_search_index_helpers.mock_remove_program.assert_not_called()
    else:
        mock_search_index_helpers.mock_remove_program.assert_called_once_with(resource)
        mock_search_index_helpers.mock_remove_course.assert_not_called()


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_resource_delete(mock_search_index_helpers, resource_type):
    """The plugin function should remove a resource from the search index then delete the resource"""
    resource = LearningResourceFactory.create(resource_type=resource_type)
    SearchIndexPlugin().resource_delete(resource)
    if resource_type == COURSE_TYPE:
        mock_search_index_helpers.mock_remove_course.assert_called_once_with(resource)
        mock_search_index_helpers.mock_remove_program.assert_not_called()
    else:
        mock_search_index_helpers.mock_remove_program.assert_called_once_with(resource)
        mock_search_index_helpers.mock_remove_course.assert_not_called()
    assert LearningResource.objects.filter(id=resource.id).exists() is False


@pytest.mark.django_db()
def test_search_index_plugin_resource_run_upserted(mocker):
    """The plugin function should upsert a run's contenfiles to the search index"""
    mock_upsert_contentfile = mocker.patch(
        "learning_resources_search.plugins.search_index_helpers.index_run_content_files"
    )
    run = LearningResourceRunFactory.create()
    SearchIndexPlugin().resource_run_upserted(run)
    mock_upsert_contentfile.assert_called_once_with(run.id)


@pytest.mark.django_db()
def test_search_index_plugin_resource_run_unpublished(mock_search_index_helpers):
    """The plugin function should remove a run's contenfiles from the search index"""
    run = LearningResourceRunFactory.create()
    SearchIndexPlugin().resource_run_unpublished(run)
    mock_search_index_helpers.mock_remove_contentfiles.assert_called_once_with(
        run.id, unpublished_only=False
    )


@pytest.mark.django_db()
def test_search_index_plugin_resource_run_delete(mock_search_index_helpers):
    """The plugin function should remove contenfiles from the index and delete the run"""
    run = LearningResourceRunFactory.create()
    run_id = run.id
    SearchIndexPlugin().resource_run_delete(run)
    mock_search_index_helpers.mock_remove_contentfiles.assert_called_once_with(
        run_id, unpublished_only=False
    )
    assert LearningResourceRun.objects.filter(id=run_id).exists() is False
