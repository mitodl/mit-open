import urllib

import pytest

from channels.factories import ChannelFactory
from learning_resources_search.api import adjust_original_query_for_percolate
from learning_resources_search.factories import PercolateQueryFactory
from learning_resources_search.models import PercolateQuery
from learning_resources_search.serializers import (
    PercolateQuerySubscriptionRequestSerializer,
)


@pytest.fixture()
def mocked_api(mocker):
    """Mock object that patches the channels API"""
    return mocker.patch("learning_resources_search.tasks.api")


@pytest.mark.django_db()
def test_realign_channel_subscriptions(mocked_api, mocker):
    channel = ChannelFactory.create(search_filter="offered_by=mitx")
    query_string = channel.search_filter
    percolate_serializer = PercolateQuerySubscriptionRequestSerializer(
        data=urllib.parse.parse_qs(query_string)
    )
    percolate_serializer.is_valid()
    adjusted_original_query = adjust_original_query_for_percolate(
        percolate_serializer.get_search_request_data()
    )
    duplicate_query = adjusted_original_query.copy()
    duplicate_query["yearly_decay_percent"] = None
    PercolateQueryFactory.create(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=adjusted_original_query,
    )
    PercolateQueryFactory.create(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=duplicate_query,
    )
