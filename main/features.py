"""MIT Open feature flags"""
import logging

from enum import StrEnum
from functools import wraps
from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

import posthog

from authentication.backends.ol_open_id_connect import OlOpenIdConnectAuth


log = logging.getLogger()


User = get_user_model()


class Features(StrEnum):
    """Enum for feature flags"""


def configure():
    """
    Configure the posthog default_client.

    The posthog library normally takes care of this but it doesn't
    expose all the client config options.
    """
    posthog.default_client = posthog.Client(
        api_key=settings.POSTHOG_PROJECT_API_KEY,
        host=settings.POSTHOG_API_HOST,
        debug=settings.DEBUG,
        on_error=None,
        send=None,
        sync_mode=False,
        poll_interval=30,
        disable_geoip=True,
        feature_flags_request_timeout_seconds=3,
    )


def default_unique_id() -> str:
    """Get the default unique_id if it's not provided"""
    return settings.hostname


def user_unique_id(user: Optional[User]) -> Optional[str]:
    """
    Get a unique id for a given user.
    """
    if user is None or user.is_anonymous():
        return None

    try:
        # we use the keycloak uid because that should be ubiquitous across all apps
        return user.social_auth.get(
            provider=OlOpenIdConnectAuth.name
        ).uid
    except ObjectDoesNotExist:
        # this user was created out-of-band (e.g. createsuperuser)
        # so we won't support this edge case
        log.exception(
            "Unable to pick posthog unique_id for user due to no keycloak auth: %s",
            user.id,
        )
        return None
    except:
        log.exception("Unexpected error trying to pick posthog unique_id for user")
        return None


def _get_person_properties(unique_id: str) -> dict:
    """
    Get posthog person_properties based on unique_id
    """
    return {
        "environment": settings.ENVIRONMENT,
        "user_id": unique_id,
    }


def get_all_feature_flags(unique_id: Optional[str]=None):
    """
    Get the set of all feature flags
    """
    unique_id = unique_id or default_unique_id()

    return posthog.get_all_feature_flags(
        unique_id,
        person_properties=_get_person_properties(unique_id),
    )


def is_enabled(
    name: str,
    default: Optional[bool]=None,
    unique_id: Optional[str]=None,
) -> bool:
    """
    Return True if the feature flag is enabled

    Args:
        name (str): feature flag name
        default (bool): default value if not set in settings
        unique_id (str):
            person identifier passed back to posthog which is the display value for
            person. I recommend this be user.id for logged-in users to allow for
            more readable user flags as well as more clear troubleshooting. For
            anonymous users, a persistent ID will help with troubleshooting and tracking
            efforts.

    Returns:
        bool: True if the feature flag is enabled
    """
    unique_id = unique_id or default_unique_id()

    # value will be None if either there is no value or we can't get a response back
    value = posthog.get_feature_flag(
        name,
        unique_id,
        person_properties=_get_person_properties(unique_id),
    ) if settings.POSTHOG_ENABLED else None

    return (
        value
        if value is not None
        else settings.FEATURES.get(name, default or settings.FEATURES_DEFAULT)
    )


def if_feature_enabled(name: str, default: Optional[bool]=None):
    """
    Wrapper that results in a no-op if the given feature isn't enabled, and otherwise
    runs the wrapped function as normal.

    Args:
        name (str): Feature flag name
        default (bool): default value if not set in settings
    """  # noqa: D401

    def if_feature_enabled_inner(func):
        @wraps(func)
        def wrapped_func(*args, **kwargs):
            if not is_enabled(name, default):
                # If the given feature name is not enabled, do nothing (no-op).
                return None
            else:
                # If the given feature name is enabled, call the function and return as normal.  # noqa: E501
                return func(*args, **kwargs)

        return wrapped_func

    return if_feature_enabled_inner


