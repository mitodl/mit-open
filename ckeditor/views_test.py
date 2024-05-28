"""tests for the ckeditor view"""

import math
from time import time

import jwt
import pytest
from django.urls import reverse
from rest_framework import status


def test_get_ckeditor(client, user, settings):
    """Test that a JWT is sent up"""
    settings.CKEDITOR_SECRET_KEY = "super secret"  # noqa: S105
    settings.CKEDITOR_ENVIRONMENT_ID = "environment"
    client.force_login(user)
    resp = client.get(reverse("ckeditor:v0:ckeditor-settings"))
    assert resp.status_code == status.HTTP_200_OK
    jwt_body = jwt.decode(
        resp.json()["token"], settings.CKEDITOR_SECRET_KEY, algorithms=["HS256"]
    )
    assert jwt_body["iss"] == settings.CKEDITOR_ENVIRONMENT_ID
    assert jwt_body["iat"] <= math.floor(time())


@pytest.mark.parametrize(
    ("secret_key", "env_id"),
    [
        (None, None),
        ("secret", None),
        (None, "env_id"),
    ],
)
def test_get_ckeditor_not_configured(client, user, settings, secret_key, env_id):  # pylint: disable=too-many-arguments
    """Test that we return the status we expect"""
    settings.CKEDITOR_SECRET_KEY = secret_key
    settings.CKEDITOR_ENVIRONMENT_ID = env_id
    client.force_login(user)
    resp = client.get(reverse("ckeditor:v0:ckeditor-settings"))
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["token"] is None
