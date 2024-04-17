"""Tests for search views"""

import json
from types import SimpleNamespace

import factory
import pytest
from django.db.models import signals
from django.urls import reverse
from opensearchpy.exceptions import TransportError
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from learning_resources_search.constants import CONTENT_FILE_TYPE, LEARNING_RESOURCE
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
        "total": {"value": 1},
        "hits": [],
    },
}


@pytest.fixture()
def learning_resources_search_view():
    """Fixture with relevant properties for testing the search view"""
    return SimpleNamespace(url=reverse("lr_search:v1:learning_resources_search"))


@pytest.fixture()
def content_file_search_view():
    """Fixture with relevant properties for testing the search view"""
    return SimpleNamespace(url=reverse("lr_search:v1:content_file_search"))


@pytest.fixture()
def learning_resources_search_subscribe_view():
    """Fixture with relevant properties for testing the search view"""
    return SimpleNamespace(
        url=reverse("lr_search:v1:learning_resources_search_subscribe")
    )


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
        | {"endpoint": LEARNING_RESOURCE}
    )
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        SearchResponseSerializer(FAKE_SEARCH_RESPONSE).data
    )


def test_learn_resources_search_next_pagination(
    mocker, client, learning_resources_search_view
):
    """If there are more pages to show we should have a next url"""
    resources_search_url = reverse("lr_search:v1:learning_resources_search")
    expected_next_url = f"http://testserver{resources_search_url}?limit=3&offset=6"
    mock_response = dict(FAKE_SEARCH_RESPONSE)

    mock_response["hits"]["total"]["value"] = 29

    mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=mock_response,
    )
    params = {"offset": 3, "limit": 3}

    resp = client.get(learning_resources_search_view.url, params)
    response_next_url = resp.json()["next"]
    assert expected_next_url == response_next_url


def test_learn_resources_search_previous_pagination(
    mocker, client, learning_resources_search_view
):
    """If we are not on the first page we should have a previous url"""
    resources_search_url = reverse("lr_search:v1:learning_resources_search")
    expected_previous_url = f"http://testserver{resources_search_url}?limit=3&offset=0"
    mock_response = dict(FAKE_SEARCH_RESPONSE)

    mock_response["hits"]["total"]["value"] = 29

    mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=mock_response,
    )
    params = {
        "offset": 3,
        "limit": 3,
    }

    resp = client.get(learning_resources_search_view.url, params)
    response_previous_url = resp.json()["previous"]
    assert expected_previous_url == response_previous_url


def test_learn_resources_search_previous_pagination_link_empty_on_first_page(
    mocker, client, learning_resources_search_view
):
    """If we are on the very first page, we should not have a previous url"""
    mock_response = dict(FAKE_SEARCH_RESPONSE)

    mock_response["hits"]["total"]["value"] = 29

    mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=mock_response,
    )
    params = {
        "offset": 0,
        "limit": 3,
    }

    resp = client.get(learning_resources_search_view.url, params)
    response_previous_url = resp.json()["previous"]
    assert response_previous_url is None


def test_learn_resources_search_next_pagination_link_empty_on_last_page(
    mocker, client, learning_resources_search_view
):
    """If we are on the last page of results, we should not have a "next" url"""
    mock_response = dict(FAKE_SEARCH_RESPONSE)

    mock_response["hits"]["total"]["value"] = 29

    mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=mock_response,
    )
    params = {
        "offset": 25,
        "limit": 10,
    }

    resp = client.get(learning_resources_search_view.url, params)
    response_next_url = resp.json()["next"]
    assert response_next_url is None


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


def test_learn_search_with_extra_params(mocker, client, learning_resources_search_view):
    """Return an error if there are extra parameters"""
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"monkey": 22}
    resp = client.get(learning_resources_search_view.url, params)
    search_mock.assert_not_called()
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        {"non_field_errors": ["Unknown field(s): monkey"]}
    )


def test_content_file_search(mocker, client, content_file_search_view):
    """The query params should be passed from the front end to execute_learn_search to run the search"""
    request_factory = APIRequestFactory()
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"q": "text"}
    request = Request(request_factory.get(content_file_search_view.url, params))
    resp = client.get(content_file_search_view.url, params)
    search_mock.assert_called_once_with(
        ContentFileSearchRequestSerializer(params).data
        | {"endpoint": CONTENT_FILE_TYPE}
    )
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        SearchResponseSerializer(
            FAKE_SEARCH_RESPONSE, context={"request": request}
        ).data
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


def test_content_file_search_with_extra_params(
    mocker, client, content_file_search_view
):
    """Return an error if there are extra parameters"""
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"monkey": 22}
    resp = client.get(content_file_search_view.url, params)
    search_mock.assert_not_called()
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        {"non_field_errors": ["Unknown field(s): monkey"]}
    )


@pytest.mark.django_db()
@factory.django.mute_signals(signals.post_delete, signals.post_save)
def test_user_subscribe_to_search(
    mocker, client, user, learning_resources_search_subscribe_view
):
    """Return an error if there are extra parameters"""
    client.force_login(user)
    search_mock = mocker.patch(
        "learning_resources_search.views.execute_learn_search",
        autospec=True,
        return_value=FAKE_SEARCH_RESPONSE,
    )
    params = {"q": "monkey"}
    assert user.percolate_queries.count() == 0
    url = learning_resources_search_subscribe_view.url
    resp = client.post(url, json.dumps(params), content_type="application/json")
    search_mock.assert_not_called()
    assert JSONRenderer().render(resp.json()) == JSONRenderer().render(
        {
            "bool": {
                "must": [
                    {
                        "bool": {
                            "filter": [
                                {
                                    "bool": {
                                        "must": [
                                            {
                                                "bool": {
                                                    "should": [
                                                        {
                                                            "multi_match": {
                                                                "query": "monkey",
                                                                "fields": [
                                                                    "title.english^3",
                                                                    "description.english^2",
                                                                    "full_description.english",
                                                                    "topics",
                                                                    "platform",
                                                                    "readable_id",
                                                                    "offered_by",
                                                                    "course_feature",
                                                                    "course",
                                                                    "video.transcript.english",
                                                                ],
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "topics",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "monkey",
                                                                        "fields": [
                                                                            "topics.name"
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "departments",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "monkey",
                                                                        "fields": [
                                                                            "departments.department_id"
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "wildcard": {
                                                                "readable_id": {
                                                                    "value": "MONKEY*",
                                                                    "rewrite": "constant_score",
                                                                }
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "course.course_numbers",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "monkey",
                                                                        "fields": [
                                                                            "course.course_numbers.value"
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "runs",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "monkey",
                                                                        "fields": [
                                                                            "runs.year",
                                                                            "runs.semester",
                                                                            "runs.level",
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "runs",
                                                                "query": {
                                                                    "nested": {
                                                                        "path": "runs.instructors",
                                                                        "query": {
                                                                            "multi_match": {
                                                                                "query": "monkey",
                                                                                "fields": [
                                                                                    "runs.instructors.first_name",
                                                                                    "runs.instructors.last_name",
                                                                                    "runs.instructors.full_name",
                                                                                ],
                                                                            }
                                                                        },
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "has_child": {
                                                                "type": "content_file",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "monkey",
                                                                        "fields": [
                                                                            "content",
                                                                            "title.english^3",
                                                                            "short_description.english^2",
                                                                            "content_feature_type",
                                                                        ],
                                                                    }
                                                                },
                                                                "score_mode": "avg",
                                                            }
                                                        },
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            "should": [
                                {
                                    "multi_match": {
                                        "query": "monkey",
                                        "fields": [
                                            "title.english^3",
                                            "description.english^2",
                                            "full_description.english",
                                            "topics",
                                            "platform",
                                            "readable_id",
                                            "offered_by",
                                            "course_feature",
                                            "course",
                                            "video.transcript.english",
                                        ],
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "topics",
                                        "query": {
                                            "multi_match": {
                                                "query": "monkey",
                                                "fields": ["topics.name"],
                                            }
                                        },
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "departments",
                                        "query": {
                                            "multi_match": {
                                                "query": "monkey",
                                                "fields": ["departments.department_id"],
                                            }
                                        },
                                    }
                                },
                                {
                                    "wildcard": {
                                        "readable_id": {
                                            "value": "MONKEY*",
                                            "rewrite": "constant_score",
                                        }
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "course.course_numbers",
                                        "query": {
                                            "multi_match": {
                                                "query": "monkey",
                                                "fields": [
                                                    "course.course_numbers.value"
                                                ],
                                            }
                                        },
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "runs",
                                        "query": {
                                            "multi_match": {
                                                "query": "monkey",
                                                "fields": [
                                                    "runs.year",
                                                    "runs.semester",
                                                    "runs.level",
                                                ],
                                            }
                                        },
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "runs",
                                        "query": {
                                            "nested": {
                                                "path": "runs.instructors",
                                                "query": {
                                                    "multi_match": {
                                                        "query": "monkey",
                                                        "fields": [
                                                            "runs.instructors.first_name",
                                                            "runs.instructors.last_name",
                                                            "runs.instructors.full_name",
                                                        ],
                                                    }
                                                },
                                            }
                                        },
                                    }
                                },
                                {
                                    "has_child": {
                                        "type": "content_file",
                                        "query": {
                                            "multi_match": {
                                                "query": "monkey",
                                                "fields": [
                                                    "content",
                                                    "title.english^3",
                                                    "short_description.english^2",
                                                    "content_feature_type",
                                                ],
                                            }
                                        },
                                        "score_mode": "avg",
                                    }
                                },
                            ],
                        }
                    }
                ],
                "filter": [
                    {"exists": {"field": "resource_type"}},
                    {
                        "bool": {
                            "must": [
                                {
                                    "bool": {
                                        "should": [
                                            {
                                                "term": {
                                                    "resource_type": {
                                                        "value": "course",
                                                        "case_insensitive": True,
                                                    }
                                                }
                                            },
                                            {
                                                "term": {
                                                    "resource_type": {
                                                        "value": "program",
                                                        "case_insensitive": True,
                                                    }
                                                }
                                            },
                                            {
                                                "term": {
                                                    "resource_type": {
                                                        "value": "podcast",
                                                        "case_insensitive": True,
                                                    }
                                                }
                                            },
                                            {
                                                "term": {
                                                    "resource_type": {
                                                        "value": "podcast_episode",
                                                        "case_insensitive": True,
                                                    }
                                                }
                                            },
                                            {
                                                "term": {
                                                    "resource_type": {
                                                        "value": "learning_path",
                                                        "case_insensitive": True,
                                                    }
                                                }
                                            },
                                            {
                                                "term": {
                                                    "resource_type": {
                                                        "value": "video",
                                                        "case_insensitive": True,
                                                    }
                                                }
                                            },
                                            {
                                                "term": {
                                                    "resource_type": {
                                                        "value": "video_playlist",
                                                        "case_insensitive": True,
                                                    }
                                                }
                                            },
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                ],
            }
        }
    )
    assert user.percolate_queries.count() == 1
