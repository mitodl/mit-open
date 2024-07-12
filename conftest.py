"""Project conftest"""

# pylint: disable=wildcard-import, unused-wildcard-import
import pytest

from fixtures.aws import *  # noqa: F403
from fixtures.common import *  # noqa: F403
from fixtures.opensearch import *  # noqa: F403
from fixtures.users import *  # noqa: F403
from main.exceptions import DoNotUseRequestException


@pytest.fixture(autouse=True)
def prevent_requests(mocker, request):  # noqa: PT004
    """Patch requests to error on request by default"""
    if "mocked_responses" in request.fixturenames:
        return
    mocker.patch(
        "requests.sessions.Session.request",
        autospec=True,
        side_effect=DoNotUseRequestException,
    )


@pytest.fixture(autouse=True)
def _disable_silky(settings):
    """Disable django-silky during tests"""
    settings.SILKY_INTERCEPT_PERCENT = 0

    settings.MIDDLEWARE = tuple(
        middleware
        for middleware in settings.MIDDLEWARE
        if middleware != "silk.middleware.SilkyMiddleware"
    )
