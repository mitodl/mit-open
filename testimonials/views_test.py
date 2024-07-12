"""Test for testimonial views."""

from datetime import timedelta

import pytest
from django.urls import reverse
from freezegun import freeze_time

from channels.factories import ChannelFactory
from learning_resources.factories import LearningResourceOfferorFactory
from main.utils import now_in_utc
from testimonials.factories import AttestationFactory
from testimonials.models import Attestation
from testimonials.serializers import AttestationSerializer

pytestmark = pytest.mark.django_db


def test_attestation_list(client):
    """Test that attestations can be listed"""

    attestation_batch = sorted(AttestationFactory.create_batch(5), key=lambda a: a.id)

    list_url = reverse("testimonials:v0:testimonials_api-list")
    response = client.get(list_url).json()

    assert len(attestation_batch) == response["count"]

    sorted_response = sorted(response["results"], key=lambda a: a["id"])
    for idx, attestation in enumerate(attestation_batch):
        assert sorted_response[idx] == AttestationSerializer(instance=attestation).data


@pytest.mark.parametrize("filter_channels", [True, False])
@pytest.mark.parametrize("filter_offerors", [True, False])
@pytest.mark.parametrize("filter_offeror_and_channel", [True, False])
def test_attestation_filters(
    client, filter_channels, filter_offerors, filter_offeror_and_channel
):
    """
    Test that attestations can be listed with filters

    Some explanation for the filtering options:
    - You can filter by channel and offeror. This is an "and" search.
    - Setting filter_offeror_and_channel tests searching for a matching set of
      offeror and channel. A channel is added to the last attestation in the
      batch, and an offeror is added to the _last two_ attestations. If this
      flag is set, the search will be for the offeror and channel added to the
      last attestation; otherwise, it'll be for the channel and the offeror
      added to the 4th attestation.
    """

    attestation_batch = sorted(AttestationFactory.create_batch(6), key=lambda a: a.id)
    api_params = {}

    if filter_channels:
        # Add a known channel to the last one of these.
        # We'll put this at the end - if channels and offerors filters are both
        # active, we'll expect to receive nothing.
        channel = ChannelFactory.create()
        attestation_with_channel = attestation_batch[5]
        attestation_with_channel.channels.add(channel)
        attestation_with_channel.save()
        api_params["channels"] = [channel.id]

    if filter_offerors:
        # Add a known offeror to two of the testimonials.
        # We'll add this to the second to last and to the last ones, so we can
        # make sure filtering by both offeror and channel works.
        offeror1 = LearningResourceOfferorFactory.create(code="ocw")
        attestation_with_offeror = attestation_batch[4]
        attestation_with_offeror.offerors.add(offeror1)
        attestation_with_offeror.save()
        offeror2 = LearningResourceOfferorFactory.create(code="see")
        attestation_with_offeror = attestation_batch[5]
        attestation_with_offeror.offerors.add(offeror2)
        attestation_with_offeror.save()

    if filter_channels or filter_offerors:
        [
            attestation_batch[idx].refresh_from_db()
            for idx, _ in enumerate(attestation_batch)
        ]

    if filter_offerors:
        if filter_offeror_and_channel:
            # Test filtering by an offeror and a channel. If we're not filtering
            # offeror anyway, then this test doesn't make sense.
            api_params["offerors"] = [offeror2.code]
        else:
            api_params["offerors"] = [offeror1.code]

    list_url = reverse("testimonials:v0:testimonials_api-list")
    response = client.get(list_url, api_params).json()

    if not filter_channels and not filter_offerors:
        assert len(attestation_batch) == response["count"]

    if filter_offerors != filter_channels:
        assert response["count"] == 1

    if filter_channels and filter_offerors:
        if filter_offeror_and_channel:
            assert response["count"] == 1
        else:
            assert response["count"] == 0


def test_attestation_published(client):
    """Test that just published attestations are listed"""

    attestation_batch = sorted(AttestationFactory.create_batch(4), key=lambda a: a.id)

    attestation_batch[0].publish_date = None
    attestation_batch[1].publish_date = None

    past_date = now_in_utc() - timedelta(days=15)
    attestation_batch[2].publish_date = past_date
    attestation_batch[3].publish_date = past_date
    Attestation.objects.bulk_update(attestation_batch, fields=["publish_date"])

    hidden_attestation_batch = sorted(
        AttestationFactory.create_batch(2), key=lambda a: a.id
    )

    future_date = now_in_utc() + timedelta(days=(99 * 365))
    hidden_attestation_batch[0].publish_date = future_date
    hidden_attestation_batch[1].publish_date = future_date
    Attestation.objects.bulk_update(hidden_attestation_batch, fields=["publish_date"])

    list_url = reverse("testimonials:v0:testimonials_api-list")
    response = client.get(list_url).json()

    assert response["count"] == len(attestation_batch)

    hidden_attestations_found = 0
    for attestation in response["results"]:
        for hidden_attestation in hidden_attestation_batch:
            if hidden_attestation.id == attestation["id"]:
                hidden_attestation_batch += 1

    assert hidden_attestations_found == 0


def test_attestation_order(client):
    """
    Test that attestations are displayed in the correct order.

    Attestations should be displayed:
    - In the order set by the `postition` field
    - In the case where more than one row has the same position, they should be
      displayed in order of `updated_on` for that position.
    """

    attestation_batch = [AttestationFactory.create(position=i) for i in range(1, 6)]

    with freeze_time(now_in_utc() - timedelta(days=7)):
        attestation_batch.append(AttestationFactory.create(position=3))

    list_url = reverse("testimonials:v0:testimonials_api-list")
    response = client.get(list_url).json()

    assert response["count"] == len(attestation_batch)

    # idx 2,3 should have position 3
    assert response["results"][2]["position"] == 3
    assert response["results"][3]["position"] == 3

    # idx 2 should be the one that we appended separately
    assert response["results"][2]["updated_on"] > response["results"][3]["updated_on"]
