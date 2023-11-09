"""Test for learning_resources views"""

import pytest
from django.test import Client
from rest_framework.reverse import reverse
from social_django.models import UserSocialAuth

from authentication.backends.ol_open_id_connect import OlOpenIdConnectAuth
from open_discussions.factories import UserFactory

pytestmark = [pytest.mark.django_db]


def test_successful_backend_logout_request(client, mocker):
    """
    Test backend-logout endpoint.  Request is properly formatted
    resulting in the associated user with an active session
    having their session deleted.
    """

    user = UserFactory.create(is_staff=True)
    uid = "f7918665-742d-4a58-8379-5e6a89052e81"
    UserSocialAuth.objects.create(uid=uid, provider=OlOpenIdConnectAuth.name, user=user)
    client.force_login(user)

    url = reverse("backend-logout")
    mocker.patch(
        "authentication.backends.ol_open_id_connect.OlOpenIdConnectAuth.validate_logout_token_and_return_claims",
        return_value={
            "iat": "123",
            "jti": "1ef8ccef-33e1-4ea2-b3a7-d20f7810ba19",
            "iss": "https://sso-qa.odl.mit.edu/realms/olapps",
            "aud": "ol-open-discussions-local",
            "sub": uid,
            "typ": "Logout",
            "events": {"http://schemas.openid.net/event/backchannel-logout": {}},
        },
    )

    data = [{"logout_token": "fake.token.value"}]

    assert user.session_set.all().count() == 1
    external_keycloak_client = Client()
    request = external_keycloak_client.post(
        url, data=data, content_type="application/json"
    )
    assert request.status_code == 200
    assert user.session_set.all().count() == 0


def test_successful_backend_logout_request_no_active_session(mocker):
    """
    Test backend-logout endpoint.  Request is properly formatted
    resulting in no update to the associated user with NO active session.
    """

    user = UserFactory.create(is_staff=True)
    uid = "f7918665-742d-4a58-8379-5e6a89052e81"
    UserSocialAuth.objects.create(uid=uid, provider=OlOpenIdConnectAuth.name, user=user)

    url = reverse("backend-logout")
    mocker.patch(
        "authentication.backends.ol_open_id_connect.OlOpenIdConnectAuth.validate_logout_token_and_return_claims",
        return_value={
            "iat": "123",
            "jti": "1ef8ccef-33e1-4ea2-b3a7-d20f7810ba19",
            "iss": "https://sso-qa.odl.mit.edu/realms/olapps",
            "aud": "ol-open-discussions-local",
            "sub": uid,
            "typ": "Logout",
            "events": {"http://schemas.openid.net/event/backchannel-logout": {}},
        },
    )

    data = [{"logout_token": "fake.token.value"}]

    assert user.session_set.all().count() == 0
    external_keycloak_client = Client()
    request = external_keycloak_client.post(
        url, data=data, content_type="application/json"
    )
    assert request.status_code == 200
    assert user.session_set.all().count() == 0


def test_unsuccessful_backend_logout_request_improperly_formatted_request():
    """
    Test backend-logout endpoint.  Request is improperly formatted
    resulting in a 400 response
    """

    url = reverse("backend-logout")

    data = [{"bad_token_name": "fake.token.value"}]

    external_keycloak_client = Client()
    request = external_keycloak_client.post(
        url, data=data, content_type="application/json"
    )
    assert request.status_code == 400


def test_unsuccessful_backend_logout_request_sub_no_match_user(mocker, client):
    """
    Test backend-logout endpoint.  Request is properly formatted
    but the sub claim does not match any social auth record resulting
    in a 400 response.  No user should be logged out.
    """

    user = UserFactory.create(is_staff=True)
    client.force_login(user)
    uid = "f7918665-742d-4a58-8379-5e6a89052e81"
    UserSocialAuth.objects.create(uid=uid, provider=OlOpenIdConnectAuth.name, user=user)

    url = reverse("backend-logout")
    mocker.patch(
        "authentication.backends.ol_open_id_connect.OlOpenIdConnectAuth.validate_logout_token_and_return_claims",
        return_value={
            "iat": "123",
            "jti": "1ef8ccef-33e1-4ea2-b3a7-d20f7810ba19",
            "iss": "https://sso-qa.odl.mit.edu/realms/olapps",
            "aud": "ol-open-discussions-local",
            "sub": "wrong_uid_does_not_match_any_user",
            "typ": "Logout",
            "events": {"http://schemas.openid.net/event/backchannel-logout": {}},
        },
    )

    data = [{"logout_token": "fake.token.value"}]

    assert user.session_set.all().count() == 1
    external_keycloak_client = Client()
    request = external_keycloak_client.post(
        url, data=data, content_type="application/json"
    )
    assert request.status_code == 400
    assert user.session_set.all().count() == 1


def test_unsuccessful_backend_logout_request_sub_missing(mocker, client):
    """
    Test backend-logout endpoint.  Request is properly formatted
    but the sub claim is not included in the logout_token resulting
    in a 400 response.  No user should be logged out.
    """

    user = UserFactory.create(is_staff=True)
    client.force_login(user)
    uid = "f7918665-742d-4a58-8379-5e6a89052e81"
    UserSocialAuth.objects.create(uid=uid, provider=OlOpenIdConnectAuth.name, user=user)

    url = reverse("backend-logout")
    mocker.patch(
        "authentication.backends.ol_open_id_connect.OlOpenIdConnectAuth.validate_logout_token_and_return_claims",
        return_value={
            "iat": "123",
            "jti": "1ef8ccef-33e1-4ea2-b3a7-d20f7810ba19",
            "iss": "https://sso-qa.odl.mit.edu/realms/olapps",
            "aud": "ol-open-discussions-local",
            "typ": "Logout",
            "events": {"http://schemas.openid.net/event/backchannel-logout": {}},
        },
    )

    data = [{"logout_token": "fake.token.value"}]

    assert user.session_set.all().count() == 1
    external_keycloak_client = Client()
    request = external_keycloak_client.post(
        url, data=data, content_type="application/json"
    )
    assert request.status_code == 400
    assert user.session_set.all().count() == 1
