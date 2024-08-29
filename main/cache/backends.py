from django.core.cache import caches
from django.core.cache.backends.base import DEFAULT_TIMEOUT, BaseCache


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
        self.default_timeout = params.get("TIMEOUT", None)

    def get_backend_timeout(self, timeout=DEFAULT_TIMEOUT):
        """
        Return the timeout to pass to fallback caches
        """
        if timeout == DEFAULT_TIMEOUT:
            timeout = self.default_timeout

        return timeout

    def get(self, key, default=None, version=None):
        """Get the value from the caches in order"""
        cache_misses = []
        result = None

        for cache_name in self._cache_names:
            cache = caches[cache_name]
            # explicitly pass None here because it'd cause a false positive
            result = cache.get(key, default=None, version=version)
            if result is not None:
                break
            else:
                cache_misses.append(cache)

        # We need to manually set the value in caches that missed
        # because consumers of get() will typically not call set() if get()
        # returns a value. If it doesn't return a value, consumers will
        # compute the value and then call set().
        if result is not None:
            for cache in cache_misses:
                cache.set(
                    key, result, timeout=self.get_backend_timeout(), version=version
                )

            return result

        return default

    def set(self, key, value, timeout=DEFAULT_TIMEOUT, version=None):
        """Set a value in the caches"""
        for cache_name in self._cache_names:
            cache = caches[cache_name]
            timeout = self.get_backend_timeout(timeout)
            cache.set(
                key,
                value,
                timeout=timeout,
                version=version,
            )
