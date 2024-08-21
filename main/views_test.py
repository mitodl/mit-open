"""Tests for the utility views"""

import uuid


def test_anon_error(client):
    """Test that we get an error as we expect from a nonsense URL with an anonymous session."""

    response = client.get(f"/{uuid.uuid4()}")

    assert response.status_code == 404


def test_authed_error(user_client):
    """Test that we get an error as we expect from a nonsense URL with a session."""

    response = user_client.get(f"/{uuid.uuid4()}")

    assert response.status_code == 404


def test_redirect_route(settings, user_client):
    """
    Simple Test that checks that we have a catch all redirect view
    so that is not accidently removed
    """
    response = user_client.get("/app", follow=True)
    assert response.redirect_chain[0][0] == settings.APP_BASE_URL
    assert response.redirect_chain[0][1] == 302
