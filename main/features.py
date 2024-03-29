"""MIT Open feature flags"""

from functools import wraps

from django.conf import settings

INDEX_UPDATES = "INDEX_UPDATES"
PROFILE_UI = "PROFILE_UI"
COURSE_UI = "COURSE_UI"
COURSE_FILE_SEARCH = "COURSE_FILE_SEARCH"
HOT_POST_REPAIR = "HOT_POST_REPAIR"
PODCAST_APIS = "PODCAST_APIS"
PODCAST_SEARCH = "PODCAST_SEARCH"
USER_LIST_SEARCH = "USER_LIST_SEARCH"


def is_enabled(name, default=None):
    """
    Returns True if the feature flag is enabled

    Args:
        name (str): feature flag name
        default (bool): default value if not set in settings

    Returns:
        bool: True if the feature flag is enabled
    """  # noqa: D401
    return settings.FEATURES.get(name, default or settings.MITOPEN_FEATURES_DEFAULT)


def if_feature_enabled(name, default=None):
    """
    Wrapper that results in a no-op if the given feature isn't enabled, and otherwise
    runs the wrapped function as normal.

    Args:
        name (str): Feature flag name
        default (bool): default value if not set in settings
    """  # noqa: D401

    def if_feature_enabled_inner(func):  # pylint: disable=missing-docstring
        @wraps(func)
        def wrapped_func(*args, **kwargs):  # pylint: disable=missing-docstring
            if not is_enabled(name, default):
                # If the given feature name is not enabled, do nothing (no-op).
                return None
            else:
                # If the given feature name is enabled, call the function and return as normal.  # noqa: E501
                return func(*args, **kwargs)

        return wrapped_func

    return if_feature_enabled_inner
