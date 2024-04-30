"""Tests for feature flags"""

import logging
from datetime import timedelta

import pytest
from django.core.cache import caches
from freezegun import freeze_time

from main import features
from main.utils import now_in_utc

pytestmark = [pytest.mark.django_db]


@pytest.mark.parametrize(
    ("value_in_settings", "default", "default_in_settings", "expected"),
    [
        (None, None, True, True),
        (None, None, False, False),
        (None, True, True, True),
        (None, True, False, True),
        (None, False, True, True),
        (None, False, False, False),
        (True, None, True, True),
        (True, None, False, True),
        (True, True, True, True),
        (True, True, False, True),
        (True, False, True, True),
        (True, False, False, True),
        (False, None, True, False),
        (False, None, False, False),
        (False, True, True, False),
        (False, True, False, False),
        (False, False, True, False),
        (False, False, False, False),
    ],
)
def test_is_enabled(
    settings, value_in_settings, default, default_in_settings, expected
):
    """Tests that is_enabled returns expected values"""
    key = "feature_key_we_will_never_use"
    settings.MITOPEN_FEATURES_DEFAULT = default_in_settings
    if value_in_settings is not None:
        settings.FEATURES[key] = value_in_settings

    assert features.is_enabled(key, default=default) is expected


# pylint: disable=too-many-arguments
@pytest.mark.parametrize(
    ("feature_enabled", "initial_value", "update_value", "expected_result_value"),
    [(True, None, "new value", "new value"), (False, None, "new value", None)],
)
def test_if_feature_enabled(  # noqa: PLR0913
    mocker,
    settings,
    feature_enabled,
    initial_value,
    update_value,
    expected_result_value,
):
    """
    Tests that if_feature_enabled turns a decorated function into a no-op if the
    given feature flag is disabled.
    """
    key = "feature_key"
    settings.FEATURES[key] = feature_enabled
    some_mock = mocker.Mock(value=initial_value)

    @features.if_feature_enabled(key)
    def mock_editing_func(value):  # pylint: disable=missing-docstring
        some_mock.value = value

    mock_editing_func(update_value)
    assert some_mock.value == expected_result_value


"""
Tests for Posthog and caching functionality

- Test grabbing flags from Posthog with a cleared cache; they should hit
  Posthog and then the flag should be cached
- Test population of the cache with calls to get_all
- Test flag grabbing after timeout
"""


def test_flags_from_cache(mocker, caplog, settings):
    """Test that flags are pulled from cache successfully."""
    get_feature_flag_mock = mocker.patch(
        "posthog.get_feature_flag", autospec=True, return_value=True
    )
    durable_cache = caches["durable"]
    settings.FEATURES["testing_function"] = True
    settings.POSTHOG_PROJECT_API_KEY = "fake key"
    cache_key = features.generate_cache_key(
        "testing_function",
        features.default_unique_id(),
        features._get_person_properties(features.default_unique_id()),  # noqa: SLF001
    )
    durable_cache.clear()

    # Cache cleared, so we should hit Posthog.

    with caplog.at_level(logging.DEBUG):
        was_enabled = features.is_enabled("testing_function")

        assert was_enabled
        assert durable_cache.get(cache_key, None) is not None
        get_feature_flag_mock.assert_called()

    assert "from Posthog" in caplog.text

    # Cache has stuff, so we should get it from that now.

    get_feature_flag_mock.reset_mock()

    with caplog.at_level(logging.DEBUG):
        was_enabled = features.is_enabled("testing_function")

        assert was_enabled
        assert durable_cache.get(cache_key, None) is not None
        get_feature_flag_mock.assert_not_called()

    assert "from the cache" in caplog.text


def test_cache_population(mocker, settings):
    """Test that the cache is populated correctly when get_all_feature_flags is called."""

    get_feature_flag_mock = mocker.patch(
        "posthog.get_feature_flag", autospec=True, return_value=True
    )
    get_all_flags_mock = mocker.patch(
        "posthog.get_all_flags",
        autospec=True,
        return_value={
            "testing_function_1": True,
            "testing_function_2": True,
            "testing_function_3": True,
        },
    )

    durable_cache = caches["durable"]

    settings.FEATURES["testing_function_1"] = True
    settings.FEATURES["testing_function_2"] = True
    settings.FEATURES["testing_function_3"] = True
    settings.POSTHOG_PROJECT_API_KEY = "fake key"

    durable_cache.clear()

    all_flags = features.get_all_feature_flags()

    get_all_flags_mock.assert_called()

    for k in all_flags:
        assert features.is_enabled(k)
        get_feature_flag_mock.assert_not_called()


def test_posthog_flag_cache_timeout(mocker, settings):
    """Test that the cache gets invalidated as we expect"""

    get_feature_flag_mock = mocker.patch(
        "posthog.get_feature_flag", autospec=True, return_value=True
    )
    durable_cache = caches["durable"]
    settings.POSTHOG_PROJECT_API_KEY = "fake key"

    durable_cache.clear()

    timeout = settings.CACHES["durable"].get("TIMEOUT", 300)

    time_freezer = freeze_time(now_in_utc() + timedelta(seconds=timeout * 2))

    assert features.is_enabled("test_function")
    get_feature_flag_mock.assert_called()

    time_freezer.start()
    assert features.is_enabled("test_function")
    get_feature_flag_mock.assert_called()
    time_freezer.stop()
