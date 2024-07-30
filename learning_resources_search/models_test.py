import pytest

from channels.factories import ChannelFactory
from learning_resources_search.factories import PercolateQueryFactory


@pytest.mark.django_db()
def test_percolate_query_unit_labels(mocker, mocked_es):
    mocker.patch(
        "learning_resources_search.indexing_api.index_percolators", autospec=True
    )
    mocker.patch(
        "learning_resources_search.indexing_api._update_document_by_id", autospec=True
    )

    ChannelFactory.create(search_filter="topic=Math", channel_type="topic")
    ChannelFactory.create(search_filter="department=physics", channel_type="department")
    unit_channel = ChannelFactory.create(
        search_filter="offered_by=mitx", channel_type="unit"
    )
    original_query = {
        "free": None,
        "endpoint": "learning_resource",
        "offered_by": ["mitx"],
        "professional": None,
        "certification": None,
        "yearly_decay_percent": None,
    }
    query = PercolateQueryFactory.create(
        original_query=original_query, query=original_query
    )
    assert query.original_url_params() == "offered_by=mitx"
    assert query.source_label() == "unit"
    assert query.source_description() == unit_channel.title


@pytest.mark.django_db()
def test_percolate_query_topic_labels(mocker, mocked_es):
    mocker.patch(
        "learning_resources_search.indexing_api.index_percolators", autospec=True
    )
    mocker.patch(
        "learning_resources_search.indexing_api._update_document_by_id", autospec=True
    )

    topic_channel = ChannelFactory.create(
        search_filter="topic=Math", channel_type="topic"
    )
    original_query = {
        "free": None,
        "endpoint": "learning_resource",
        "topic": ["Math"],
        "professional": None,
        "certification": None,
        "yearly_decay_percent": None,
    }
    query = PercolateQueryFactory.create(
        original_query=original_query, query=original_query
    )
    assert query.original_url_params() == "topic=Math"
    assert query.source_label() == "topic"
    assert query.source_description() == topic_channel.title


@pytest.mark.django_db()
def test_percolate_query_department_labels(mocker, mocked_es):
    mocker.patch(
        "learning_resources_search.indexing_api.index_percolators", autospec=True
    )
    mocker.patch(
        "learning_resources_search.indexing_api._update_document_by_id", autospec=True
    )

    department_channel = ChannelFactory.create(
        search_filter="department=physics", channel_type="department"
    )
    original_query = {
        "free": None,
        "department": ["physics"],
        "professional": None,
        "certification": None,
        "yearly_decay_percent": None,
    }
    query = PercolateQueryFactory.create(
        original_query=original_query, query=original_query
    )
    assert query.original_url_params() == "department=physics"
    assert query.source_label() == "department"
    assert query.source_description() == department_channel.title


@pytest.mark.django_db()
def test_percolate_query_search_labels(mocker, mocked_es):
    mocker.patch(
        "learning_resources_search.indexing_api.index_percolators", autospec=True
    )
    mocker.patch(
        "learning_resources_search.indexing_api._update_document_by_id", autospec=True
    )
    ChannelFactory.create(search_filter="topic=Math", channel_type="topic")
    ChannelFactory.create(search_filter="department=physics", channel_type="department")
    ChannelFactory.create(search_filter="offered_by=mitx", channel_type="unit")
    original_query = {
        "q": "testing search filter",
        "free": None,
        "department": ["physics"],
        "topic": ["math"],
        "professional": None,
        "certification": None,
        "yearly_decay_percent": None,
    }
    query = PercolateQueryFactory.create(
        original_query=original_query, query=original_query
    )
    assert (
        query.original_url_params()
        == "q=testing search filter&department=physics&topic=math"
    )
    assert query.source_label() == "saved search"
