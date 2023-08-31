# pylint: disable=redefined-outer-name
"""Tests for search views"""
from types import SimpleNamespace

import pytest
from django.contrib.auth.models import AnonymousUser
from django.urls import reverse
from opensearchpy.exceptions import TransportError

from course_catalog.factories import CourseFactory
from search.constants import COURSE_TYPE

FAKE_SEARCH_RESPONSE = {
    "took": 1,
    "timed_out": False,
    "_shards": {"total": 10, "successful": 10, "skipped": 0, "failed": 0},
    "hits": {
        "total": 20,
        "max_score": 1.0,
        "hits": [],
    },
}


@pytest.fixture()
def search_view():
    """Fixture with relevant properties for testing the search view"""
    return SimpleNamespace(url=reverse("search"))


@pytest.mark.parametrize(
    ("status_code", "raise_error"),
    [[418, False], [503, True], ["N/A", True]],  # noqa: PT007
)
def test_search_es_exception(mocker, client, search_view, status_code, raise_error):
    """If a 4xx status is returned from OpenSearch it should be returned from the API"""
    log_mock = mocker.patch("search.views.log.exception")
    search_mock = mocker.patch(
        "search.views.execute_search",
        autospec=True,
        side_effect=TransportError(status_code, "error", {}),
    )
    query = {"query": {"match": {"title": "Search"}}}
    if not raise_error:
        resp = client.post(search_view.url, query)
        assert resp.status_code == status_code
        search_mock.assert_called_once_with(query=query)
        log_mock.assert_called_once_with("Received a 4xx error from OpenSearch")
    else:
        with pytest.raises(TransportError):
            client.post(search_view.url, query)


def test_search(mocker, client, search_view):
    """The query should be passed from the front end to execute_search to run the search"""
    search_mock = mocker.patch(
        "search.views.execute_search", autospec=True, return_value=FAKE_SEARCH_RESPONSE
    )
    query = {"query": {"match": {"title": "Search"}}}
    resp = client.post(search_view.url, query)
    assert resp.json() == FAKE_SEARCH_RESPONSE
    search_mock.assert_called_once_with(query=query)


def test_learn_search(mocker, client, search_view):
    """The query should be passed from the front end to execute_learn_search to run the search"""
    search_mock = mocker.patch(
        "search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    query = {"query": {"match": {"object_type": COURSE_TYPE}}}
    resp = client.post(search_view.url, query)
    assert resp.json() == FAKE_SEARCH_RESPONSE
    search_mock.assert_called_once_with(user=AnonymousUser(), query=query)


def test_find_similar_resources(mocker, client):
    """The view should return the results of the API method for finding similar resources"""
    course = CourseFactory.create()
    doc_vals = {
        "id": course.id,
        "object_id": COURSE_TYPE,
        "title": course.title,
        "short_description": course.short_description,
    }
    fake_response = {"similar": "resources"}
    similar_resources_mock = mocker.patch(
        "search.views.find_similar_resources", autospec=True, return_value=fake_response
    )
    resp = client.post(reverse("similar-resources"), data=doc_vals)
    assert resp.json() == fake_response
    similar_resources_mock.assert_called_once_with(
        user=AnonymousUser(), value_doc=doc_vals
    )
