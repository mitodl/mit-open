"""Authentication api"""

import logging

from django.contrib.auth import get_user_model
from django.db import transaction

from profiles import api as profile_api

User = get_user_model()

log = logging.getLogger()


def create_user(username, email, profile_data=None, user_extra=None):
    """
    Ensures the user exists

    Args:
        email (str): the user's email
        profile (dic): the profile data for the user

    Returns:
        User: the user
    """  # noqa: D401
    defaults = {}

    if user_extra is not None:
        defaults.update(user_extra)

    # this takes priority over a passed in value
    defaults.update({"username": username})

    with transaction.atomic():
        user, _ = User.objects.get_or_create(email=email, defaults=defaults)

        profile_api.ensure_profile(user, profile_data=profile_data)

    return user
