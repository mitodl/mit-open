"""Auth pipline functions for email authentication"""

from social_core.exceptions import AuthException


def forbid_hijack(
    strategy,
    **kwargs,  # noqa: ARG001
):  # pylint: disable=unused-argument  # noqa: ARG001, RUF100
    """
    Forbid an admin user from trying to login/register while hijacking another user

    Args:
        strategy (social_django.strategy.DjangoStrategy): the strategy used to authenticate
        backend (social_core.backends.base.BaseAuth): the backend being used to authenticate
    """  # noqa: E501
    # As first step in pipeline, stop a hijacking admin from going any further
    if strategy.session_get("is_hijacked_user"):
        msg = "You are hijacking another user, don't try to login again"
        raise AuthException(msg)
    return {}
