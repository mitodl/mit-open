"""Profile/user filter tests"""
import pytest
from django.contrib.auth import get_user_model

from moira_lists.factories import MoiraListFactory
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


def test_user_filter_moira_lists():
    """Verify that UserFilter's moira_lists filter works"""
    matching_user = UserFactory.create()
    nonmatching_user = UserFactory.create()

    moira_list = MoiraListFactory.create()
    moira_list.users.add(matching_user)

    query = UserFilter(
        {"moira_lists": [moira_list.name]}, queryset=User.objects.all()
    ).qs

    assert matching_user in query
    assert nonmatching_user not in query


@pytest.mark.parametrize("moira_list", [None, "moira-list-1"])
@pytest.mark.parametrize("email", [None, "@matching.domain"])
def test_user_filter_filter_combos(email, moira_list):
    """Verify that UserFilter works for combinations of filters"""
    if moira_list is None and email is None:
        pytest.skip("Invalid combination")

    matching_user = UserFactory.create(email="user@matching.domain")
    nonmatching_user = UserFactory.create()

    params = {}

    if moira_list:
        moira_list = MoiraListFactory.create(name=moira_list)
        moira_list.users.add(matching_user)
        params["moira_lists"] = [moira_list]

    if email:
        params["email__endswith"] = email

    query = UserFilter(params, queryset=User.objects.all()).qs

    assert matching_user in query
    assert nonmatching_user not in query
