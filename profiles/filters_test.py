"""Profile/user filter tests"""

import pytest
from django.contrib.auth import get_user_model

from open_discussions.factories import UserFactory
from profiles.filters import UserFilter

pytestmark = pytest.mark.django_db

User = get_user_model()


def test_user_filter_email_endswith():
    """Verify that UserFilter's email__endswith filter works"""
    matching_user = UserFactory.create(email="user@matching.email")
    nonmatching_user = UserFactory.create(email="user@nonmatching.email")

    params = {"email__endswith": "@matching.email"}

    query = UserFilter(params, queryset=User.objects.all()).qs

    assert matching_user in query
    assert nonmatching_user not in query
