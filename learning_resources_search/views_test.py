"""Tests for search views"""

from types import SimpleNamespace

import pytest
from django.urls import reverse
from opensearchpy.exceptions import TransportError
from rest_framework.renderers import JSONRenderer

from learning_resources_search.serializers import (
    ContentFileSearchRequestSerializer,
    LearningResourcesSearchRequestSerializer,
    SearchResponseSerializer,
)

FAKE_SEARCH_RESPONSE = {
    "took": 1,
    "timed_out": False,
    "_shards": {"total": 10, "successful": 10, "skipped": 0, "failed": 0},
    "hits": {
        "total": {"value": 20},
        "hits": [],
    },
}


@pytest.fixture()
def learning_resources_search_view():
    """Fixture with relevant properties for testing the search view"""
    return SimpleNamespace(url=reverse("learning_resources_search"))


@pytest.fixture()
def content_file_search_view():
    """Fixture with relevant properties for testing the search view"""
    return SimpleNamespace(url=reverse("content_file_search"))


@pytest.mark.parametrize(
    ("status_code", "raise_error"), [(418, False), (503, True), ("N/A", True)]
)
def test_search_es_exception(
    mocker, client, learning_resources_search_view, status_code, raise_error
):
    """If a 4xx status is returned from OpenSearch it should be returned from the API"""
    log_mock = mocker.patch("learning_resources_search.views.log.exception")
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        side_effect=TransportError(status_code, "error", {}),
    )
    if not raise_error:
        resp = client.get(learning_resources_search_view.url)
        assert resp.status_code == status_code
        search_mock.assert_called_once()
        log_mock.assert_called_once_with("Received a 4xx error from OpenSearch")
    else:
        with pytest.raises(TransportError):
            client.get(learning_resources_search_view.url)


def test_learn_resources_search(mocker, client, learning_resources_search_view):
    """The query params should be passed from the front end to execute_learn_search to run the search"""
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"resource_type": ["course"]}
    resp = client.get(learning_resources_search_view.url, params)
    search_mock.assert_called_once_with(
        LearningResourcesSearchRequestSerializer(params).data
    )
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        SearchResponseSerializer(FAKE_SEARCH_RESPONSE).data
    )


def test_learn_search_with_invalid_params(
    mocker, client, learning_resources_search_view
):
    """Return an error if there are invalid parameters"""
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"resource_type": "book"}
    resp = client.get(learning_resources_search_view.url, params)
    search_mock.assert_not_called()
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        {"resource_type": ['"book" is not a valid choice.']}
    )


def test_content_file_search(mocker, client, content_file_search_view):
    """The query params should be passed from the front end to execute_learn_search to run the search"""
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"q": "text"}
    resp = client.get(content_file_search_view.url, params)
    search_mock.assert_called_once_with(ContentFileSearchRequestSerializer(params).data)
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        SearchResponseSerializer(FAKE_SEARCH_RESPONSE).data
    )


def test_content_file_search_with_invalid_params(
    mocker, client, content_file_search_view
):
    """Return an error if there are invalid parameters"""
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"aggregations": "invalid"}
    resp = client.get(content_file_search_view.url, params)
    search_mock.assert_not_called()
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        {"aggregations": ['"invalid" is not a valid choice.']}
    )
