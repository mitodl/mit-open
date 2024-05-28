"""Test for testimonial views."""

from datetime import timedelta

import pytest
from django.urls import reverse

from channels.factories import FieldChannelFactory
from main.utils import now_in_utc
from testimonials.factories import AttestationFactory
from testimonials.models import Attestation
from testimonials.serializers import AttestationSerializer

pytestmark = pytest.mark.django_db


def test_attestation_list(user_client):
    """Test that attestations can be listed"""

    attestation_batch = sorted(AttestationFactory.create_batch(5), key=lambda a: a.id)

    list_url = reverse("testimonials:v0:testimonials_api-list")
    response = user_client.get(list_url).json()

    assert len(attestation_batch) == response["count"]

    sorted_response = sorted(response["results"], key=lambda a: a["id"])
    for idx, attestation in enumerate(attestation_batch):
        assert sorted_response[idx] == AttestationSerializer(instance=attestation).data


@pytest.mark.parametrize("filter_channels", [True, False])
@pytest.mark.parametrize("filter_published", [True, False])
def test_attestation_filters(user_client, filter_channels, filter_published):
    """Test that attestations can be listed with filters"""

    attestation_batch = sorted(AttestationFactory.create_batch(6), key=lambda a: a.id)
    api_params = {}

    if filter_channels:
        # Add a known channel to the last one of these.
        # We'll put this at the end - if channels and published filters are both
        # active, we'll expect to receive nothing.
        channel = FieldChannelFactory.create()
        attestation_with_channel = attestation_batch[5]
        attestation_with_channel.channels.add(channel)
        attestation_with_channel.save()
        api_params["channels"] = [channel.id]

    if filter_published:
        # Set the first four to valid publish dates and the last 2 to future
        # dates (thus making them unpublished)
        attestation_batch[0].publish_date = None
        attestation_batch[1].publish_date = None

        past_date = now_in_utc() - timedelta(days=15)
        attestation_batch[2].publish_date = past_date
        attestation_batch[3].publish_date = past_date

        future_date = now_in_utc() + timedelta(days=(99 * 365))
        attestation_batch[4].publish_date = future_date
        attestation_batch[5].publish_date = future_date
        Attestation.objects.bulk_update(attestation_batch, fields=["publish_date"])

        api_params["published"] = True

    if filter_published or filter_channels:
        [
            attestation_batch[idx].refresh_from_db()
            for idx, _ in enumerate(attestation_batch)
        ]

    list_url = reverse("testimonials:v0:testimonials_api-list")
    response = user_client.get(list_url, api_params).json()

    if not filter_channels and not filter_published:
        assert len(attestation_batch) == response["count"]

    if filter_channels and filter_published:
        assert response["count"] == 0

    if filter_channels and not filter_published:
        assert response["count"] == 1

    if filter_published and not filter_channels:
        assert response["count"] == 4


def test_attestation_published(user_client):
    """Test that just published attestations can be listed"""

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
    response = user_client.get(list_url, {"published": True}).json()

    assert response["count"] == len(attestation_batch)

    hidden_attestations_found = 0
    for attestation in response["results"]:
        for hidden_attestation in hidden_attestation_batch:
            if hidden_attestation.id == attestation["id"]:
                hidden_attestation_batch += 1

    assert hidden_attestations_found == 0
