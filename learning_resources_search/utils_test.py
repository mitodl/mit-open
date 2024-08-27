import json
import urllib

import factory
import pytest
from django.db.models import signals
from django.urls import reverse

from channels.factories import ChannelFactory
from learning_resources_search.factories import PercolateQueryFactory
from learning_resources_search.models import PercolateQuery
from learning_resources_search.utils import realign_channel_subscriptions
from main.factories import UserFactory


@pytest.fixture()
def mocked_api(mocker):
    """Mock object that patches the channels API"""
    return mocker.patch("learning_resources_search.tasks.api")


@factory.django.mute_signals(signals.post_delete, signals.post_save)
@pytest.mark.django_db()
def test_realign_channel_subscriptions(mocked_api, mocker, client, user):
    """
    Test that duplicate percolate queries for a channel are consolidated
    and the users are migrated to the real instance
    """
    channel = ChannelFactory.create(search_filter="offered_by=mitx")
    query_string = channel.search_filter

    client.force_login(user)
    params = urllib.parse.parse_qs(query_string)
    params["source_type"] = PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE
    sub_url = reverse("lr_search:v1:learning_resources_user_subscription-subscribe")
    assert user.percolate_queries.count() == 0
    client.post(sub_url, json.dumps(params), content_type="application/json")
    assert user.percolate_queries.count() == 1

    percolate_query = user.percolate_queries.first()

    duplicate_query_a = percolate_query.original_query.copy()
    duplicate_query_a["yearly_decay_percent"] = None
    duplicate_query_b = percolate_query.original_query.copy()
    duplicate_query_b["foo"] = None
    duplicate_percolate_a = PercolateQueryFactory.create(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=duplicate_query_a,
    )

    duplicate_percolate_b = PercolateQueryFactory.create(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=duplicate_query_b,
    )

    duplicate_percolate_a.users.set(UserFactory.create_batch(7))
    duplicate_percolate_a.save()
    duplicate_percolate_b.save()
    duplicate_percolate_b.users.set(UserFactory.create_batch(3))
    realign_channel_subscriptions()
    channel_percolate_queries = PercolateQuery.objects.filter(
        source_type=PercolateQuery.CHANNEL_SUBSCRIPTION_TYPE,
        original_query=percolate_query.original_query,
    )
    assert channel_percolate_queries.count() == 1
    assert channel_percolate_queries.first().users.count() == 11
