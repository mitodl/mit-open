from dataclasses import dataclass

import pytest
from django.core.cache.backends.base import DEFAULT_TIMEOUT, BaseCache

from main.cache.backends import FallbackCache


@dataclass
class MockCaches:
    caches: list[BaseCache]
    cache_names: list[str]
    caches_by_name: dict[str, BaseCache]
    cache_results: list[str]


@pytest.fixture(autouse=True)
def mock_caches(mocker):
    """Define mock caches"""
    cache_names = []
    caches = []
    caches_by_name = {}
    cache_results = []

    for idx in range(3):
        name = f"dummy-{idx}"
        result = f"result-{idx}"
        mock_cache = mocker.Mock(spec=BaseCache)
        mock_cache.get.return_value = result

        cache_names.append(name)
        caches.append(mock_cache)
        caches_by_name[name] = mock_cache
        cache_results.append(result)

    mocker.patch.dict("main.cache.backends.caches", caches_by_name)

    return MockCaches(caches, cache_names, caches_by_name, cache_results)


@pytest.mark.parametrize("cache_hit_idx", range(4))
def test_fallback_cache_get(mock_caches: MockCaches, settings, cache_hit_idx):
    """Test that get() on the fallback cache works correctly"""

    cache = FallbackCache(mock_caches.cache_names, {})

    cold_caches = mock_caches.caches[:cache_hit_idx]

    for mock_cache in cold_caches:
        mock_cache.get.return_value = None

    caches_exhausted = cache_hit_idx >= len(mock_caches.caches)
    expected_value = (
        "default" if caches_exhausted else mock_caches.cache_results[cache_hit_idx]
    )

    assert cache.get("key", default="default", version=1) == expected_value

    if not caches_exhausted:
        for mock_cache in cold_caches:
            mock_cache.set.assert_called_once_with(
                "key", expected_value, timeout=cache.get_backend_timeout(), version=1
            )


@pytest.mark.parametrize("cache_timeout", [DEFAULT_TIMEOUT, None, 0, 1000])
@pytest.mark.parametrize(
    "kwargs",
    [
        {},
        {"timeout": 600},
        {"version": 1},
        {"timeout": 600, "version": 1},
    ],
)
def test_fallback_cache_set(mock_caches, settings, cache_timeout, kwargs):
    """Test that set() on the fallback cache works correctly"""
    cache = FallbackCache(mock_caches.cache_names, {"TIMEOUT": cache_timeout})
    cache.set("key", "value", **kwargs)

    expected_timeout = kwargs.get("timeout", cache_timeout)
    expected_version = kwargs.get("version", None)

    for mock_cache in mock_caches.caches:
        mock_cache.set.assert_called_once_with(
            "key", "value", timeout=expected_timeout, version=expected_version
        )
