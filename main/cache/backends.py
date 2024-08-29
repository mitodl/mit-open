from django.core.cache import caches
from django.core.cache.backends.base import BaseCache


class FallbackCache(BaseCache):
    """
    Cache backend that supports a list of fallback caches

    This cache backend sets the value in all caches and reads from caches in order
    until it gets a hit. You'll typically want to configure this with a list of
    caches with increasing durability.

    For example in settings.py:

    CACHES = {
        "fallback": {
            "BACKEND": "main.cache.backends.FallbackCache",
            "LOCATION": ["in-memory", "redis", "database"],
        },
        ...
    }
    """

    def __init__(self, cache_names, params):
        super().__init__(params)
        self._cache_names = cache_names

    def get(self, key, default=None, version=None):
        """Get the value from the caches in order"""
        for cache_name in self._cache_names:
            cache = caches[cache_name]
            result = cache.get(key, default=default, version=version)
            if result:
                return result
        return None

    def set(self, key, value, timeout=None, version=None):
        """Set a value in the caches"""
        for cache_name in self._cache_names:
            cache = caches[cache_name]
            cache.set(
                key,
                value,
                timeout=timeout,
                version=version,
            )
