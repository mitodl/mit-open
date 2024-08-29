"""Tests for the testimonial utilities"""

import pytest

from testimonials.factories import AttestationFactory
from testimonials.utils import avatar_uri, cover_uri

pytestmark = pytest.mark.django_db


@pytest.fixture
def fixture_attestation():
    """Create an attestation using the factory"""

    return AttestationFactory.create()


def test_avatar_uri(fixture_attestation):
    """
    avatar_uri should make an upload path with a timestamp
    """
    name = "name"
    ext = ".jpg"
    filename = f"{name}{ext}"
    url = avatar_uri(fixture_attestation, filename)
    assert url.startswith(f"testimonial/{fixture_attestation.attestant_name}/{name}")
    assert url.endswith(f"_avatar{ext}")


def test_cover_uri(fixture_attestation):
    """
    cover_uri should make an upload path with a timestamp
    """
    name = "name"
    ext = ".jpg"
    filename = f"{name}{ext}"
    url = cover_uri(fixture_attestation, filename)
    assert url.startswith(f"testimonial/{fixture_attestation.attestant_name}/{name}")
    assert url.endswith(f"_cover{ext}")
