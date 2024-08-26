import urllib

import pytest

from channels.factories import ChannelFactory
from learning_resources_search.api import adjust_original_query_for_percolate
from learning_resources_search.factories import PercolateQueryFactory
from learning_resources_search.models import PercolateQuery
from learning_resources_search.serializers import (
    PercolateQuerySubscriptionRequestSerializer,
)
from learning_resources_search.utils import realign_channel_subscriptions
from main.factories import UserFactory


@pytest.fixture()
def mocked_api(mocker):
    """Mock object that patches the channels API"""
    return mocker.patch("learning_resources_search.tasks.api")


@pytest.mark.django_db()
def test_realign_channel_subscriptions(mocked_api, mocker):
    """
    Test that duplicate percolate queries for a channel are consolidated
    and the users are migrated to the real instance
    """
    channel = ChannelFactory.create(search_filter="offered_by=mitx")
    query_string = channel.search_filter
    percolate_serializer = PercolateQuerySubscriptionRequestSerializer(
        data=urllib.parse.parse_qs(query_string)
    )
    percolate_serializer.is_valid()
    adjusted_original_query = adjust_original_query_for_percolate(
        percolate_serializer.get_search_request_data()
    )
    duplicate_query_a = adjusted_original_query.copy()
    duplicate_query_a["yearly_decay_percent"] = None
    duplicate_query_b = adjusted_original_query.copy()
    duplicate_query_b["foo"] = None
    percolate_query = PercolateQueryFactory.create(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=adjusted_original_query,
    )
    duplicate_percolate_a = PercolateQueryFactory.create(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=duplicate_query_a,
    )
    duplicate_percolate_b = PercolateQueryFactory.create(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=duplicate_query_b,
    )
    percolate_query.users.set(UserFactory.create_batch(2))
    duplicate_percolate_a.users.set(UserFactory.create_batch(7))
    duplicate_percolate_b.users.set(UserFactory.create_batch(3))
    realign_channel_subscriptions()
    channel_percolate_queries = PercolateQuery.objects.filter(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=adjusted_original_query,
    )
    assert channel_percolate_queries.count() == 1
    assert channel_percolate_queries.first().users.count() == 12
