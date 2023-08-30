"""Betamax fixtures"""
# pylint: disable=redefined-outer-name, unused-argument
import os
import contextlib
import warnings
from functools import partialmethod
import urllib3
import requests
import pytest
from betamax.fixtures.pytest import _casette_name

from open_discussions.betamax_config import setup_betamax


@contextlib.contextmanager
def _no_ssl_verification():
    """totally disable SSL verification, useful for Betamax tests"""
    old_request = requests.Session.request
    try:
        requests.Session.request = partialmethod(old_request, verify=False)

        warnings.filterwarnings("ignore", "Unverified HTTPS request")

        yield
    finally:
        warnings.resetwarnings()

        requests.Session.request = old_request


@pytest.fixture
def cassette_name(request):
    """Returns the cassette name for this test"""
    return _casette_name(request, parametrized=True)


@pytest.fixture
def cassette_exists(cassette_name):
    """Returns True if cassette exists"""
    path = "cassettes/{}.json".format(cassette_name)
    return os.path.exists(path)


@pytest.fixture(autouse=True)
def use_betamax(request):
    """Determines if we're using betamax"""
    marker = request.keywords.get("betamax", None)
    if marker:
        request.getfixturevalue("configure_betamax")
        return True
    return False


@pytest.fixture()
def configure_betamax(mocker, cassette_exists, request):
    """Configure betamax"""
    setup_betamax("once" if cassette_exists is False else "none")

    # defer this until we know we need it and after setup_betamax
    betamax_parametrized_recorder = request.getfixturevalue(
        "betamax_parametrized_recorder"
    )

    urllib3.disable_warnings()

    # always ignore SSL verification
    with _no_ssl_verification():
        yield betamax_parametrized_recorder
