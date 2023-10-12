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
    resp = client.get(reverse("ckeditor-token"))
    assert resp.status_code == status.HTTP_200_OK
    jwt_body = jwt.decode(
        resp.content, settings.CKEDITOR_SECRET_KEY, algorithms=["HS256"]
    )
    assert jwt_body["iss"] == settings.CKEDITOR_ENVIRONMENT_ID
    assert jwt_body["iat"] <= math.floor(time())


@pytest.mark.parametrize(
    ("secret_key", "env_id", "exp_status"),
    [
        (None, None, status.HTTP_503_SERVICE_UNAVAILABLE),
        ("secret", None, status.HTTP_503_SERVICE_UNAVAILABLE),
        (None, "env", status.HTTP_503_SERVICE_UNAVAILABLE),
        ("secret", "env", status.HTTP_200_OK),
    ],
)
def test_get_ckeditor_status(  # noqa: PLR0913
    client, user, settings, secret_key, feature_enabled, env_id, exp_status
):  # pylint: disable=too-many-arguments
    """Test that we return the status we expect"""
    settings.CKEDITOR_SECRET_KEY = secret_key
    settings.CKEDITOR_ENVIRONMENT_ID = env_id
    client.force_login(user)
    resp = client.get(reverse("ckeditor-token"))
    assert resp.status_code == exp_status
