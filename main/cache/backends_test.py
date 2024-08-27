from django.core.cache.backends.base import BaseCache

from main.cache.backends import FallbackCache


def test_fallback_cache_get(mocker, settings):
    """Test that get() on the fallback cache works correctly"""
    mock_cache_1 = mocker.Mock(spec=BaseCache)
    mock_cache_1.get.return_value = 12345
    mock_cache_2 = mocker.Mock(spec=BaseCache)
    mock_cache_2.get.return_value = 67890

    mocker.patch.dict(
        "main.cache.backends.caches", {"dummy1": mock_cache_1, "dummy2": mock_cache_2}
    )

    cache = FallbackCache(["dummy1", "dummy2"], {})

    assert cache.get("key", default="default", version=1) == 12345

    mock_cache_1.get.return_value = None

    assert cache.get("key", default="default", version=1) == 67890

    mock_cache_2.get.return_value = None

    assert cache.get("key", default="default", version=1) is None


def test_fallback_cache_set(mocker, settings):
    """Test that set() on the fallback cache works correctly"""
    mock_cache_1 = mocker.Mock(spec=BaseCache)
    mock_cache_2 = mocker.Mock(spec=BaseCache)

    mocker.patch.dict(
        "main.cache.backends.caches", {"dummy1": mock_cache_1, "dummy2": mock_cache_2}
    )

    cache = FallbackCache(["dummy1", "dummy2"], {})

    cache.set("key", "value", timeout=600, version=1)

    mock_cache_1.set.assert_called_once_with("key", "value", timeout=600, version=1)
    mock_cache_2.set.assert_called_once_with("key", "value", timeout=600, version=1)
