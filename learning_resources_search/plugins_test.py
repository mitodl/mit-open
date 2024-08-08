"""Tests for learning_resources_search plugins"""

from types import SimpleNamespace

import pytest

from learning_resources.factories import (
    LearningResourceFactory,
    LearningResourceRunFactory,
)
from learning_resources.models import LearningResourceRun
from learning_resources_search.constants import COURSE_TYPE, PROGRAM_TYPE
from learning_resources_search.plugins import SearchIndexPlugin


@pytest.fixture()
def mock_search_index_helpers(mocker):
    """Mock the search index helpers"""
    mock_upsert_learning_resource = mocker.patch(
        "learning_resources_search.plugins.tasks.upsert_learning_resource"
    )
    mock_remove_learning_resource = mocker.patch(
        "learning_resources_search.plugins.tasks.deindex_document"
    )
    mock_upsert_contentfiles = mocker.patch(
        "learning_resources_search.plugins.tasks.index_run_content_files"
    )
    mock_remove_contentfiles = mocker.patch(
        "learning_resources_search.plugins.tasks.deindex_run_content_files"
    )
    return SimpleNamespace(
        mock_upsert_learning_resource=mock_upsert_learning_resource,
        mock_remove_learning_resource=mock_remove_learning_resource,
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
    SearchIndexPlugin().resource_upserted(resource, percolate=False)

    mock_search_index_helpers.mock_upsert_learning_resource.assert_called_once_with(
        resource.id
    )


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_resource_unpublished(
    mocker, mock_search_index_helpers, resource_type
):
    """The plugin function should remove a resource from the search index"""
    resource = LearningResourceFactory.create(resource_type=resource_type)
    unpublish_run_mock = mocker.patch(
        "learning_resources_search.plugins.tasks.deindex_run_content_files"
    )
    SearchIndexPlugin().resource_unpublished(resource)
    mock_search_index_helpers.mock_remove_learning_resource.assert_called_once_with(
        resource.id, resource.resource_type
    )
    if resource_type == COURSE_TYPE:
        assert unpublish_run_mock.call_count == resource.runs.count()
        for run in resource.runs.all():
            unpublish_run_mock.assert_any_call(run.id, False)  # noqa: FBT003
    else:
        unpublish_run_mock.assert_not_called()


@pytest.mark.django_db()
@pytest.mark.parametrize("resource_type", [COURSE_TYPE, PROGRAM_TYPE])
def test_search_index_plugin_resource_before_delete(
    mock_search_index_helpers, resource_type
):
    """The plugin function should remove a resource from the search index then delete the resource"""
    resource = LearningResourceFactory.create(resource_type=resource_type)
    resource_id = resource.id
    SearchIndexPlugin().resource_before_delete(resource)

    mock_search_index_helpers.mock_remove_learning_resource.assert_called_once_with(
        resource_id, resource.resource_type
    )


@pytest.mark.django_db()
def test_search_index_plugin_resource_run_unpublished(mock_search_index_helpers):
    """The plugin function should remove a run's contenfiles from the search index"""
    run = LearningResourceRunFactory.create()
    SearchIndexPlugin().resource_run_unpublished(run)
    mock_search_index_helpers.mock_remove_contentfiles.assert_called_once_with(
        run.id,
        False,  # noqa: FBT003
    )


@pytest.mark.django_db()
def test_search_index_plugin_resource_run_delete(mock_search_index_helpers):
    """The plugin function should remove contenfiles from the index and delete the run"""
    run = LearningResourceRunFactory.create()
    run_id = run.id
    SearchIndexPlugin().resource_run_delete(run)
    mock_search_index_helpers.mock_remove_contentfiles.assert_called_once_with(
        run_id,
        False,  # noqa: FBT003
    )
    assert LearningResourceRun.objects.filter(id=run_id).exists() is False


@pytest.mark.django_db()
def test_resource_similar_topics(mocker, settings):
    """The plugin function should return expected topics for a resource"""
    expected_topics = ["topic1", "topic2"]
    mock_similar_topics = mocker.patch(
        "learning_resources_search.plugins.get_similar_topics",
        return_value=expected_topics,
    )
    resource = LearningResourceFactory.create()
    topics = SearchIndexPlugin().resource_similar_topics(resource)
    assert topics == [{"name": topic} for topic in expected_topics]
    mock_similar_topics.assert_called_once_with(
        {
            "title": resource.title,
            "description": resource.description,
            "full_description": resource.full_description,
        },
        settings.OPEN_VIDEO_MAX_TOPICS,
        settings.OPEN_VIDEO_MIN_TERM_FREQ,
        settings.OPEN_VIDEO_MIN_DOC_FREQ,
    )
