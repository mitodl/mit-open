"""Tests of user pipeline actions"""

import pytest

from authentication.pipeline import user as user_actions
from main.factories import UserFactory


@pytest.mark.parametrize("hijacked", [True, False])
def test_forbid_hijack(mocker, hijacked):
    """
    Tests that forbid_hijack action raises an exception if a user is hijacked
    """
    mock_strategy = mocker.Mock()
    mock_strategy.session_get.return_value = hijacked

    mock_backend = mocker.Mock(name="email")

    kwargs = {
        "strategy": mock_strategy,
        "backend": mock_backend,
    }

    if hijacked:
        with pytest.raises(ValueError):  # noqa: PT011
            user_actions.forbid_hijack(**kwargs)
    else:
        assert user_actions.forbid_hijack(**kwargs) == {}


@pytest.mark.django_db
@pytest.mark.parametrize("is_new", [True, False])
def test_user_created_actions(mocker, is_new):
    """
    Tests that user_created_actions creates a favorites list for new users only
    """
    user = UserFactory.create()
    kwargs = {
        "user": user,
        "is_new": is_new,
    }

    user_actions.user_created_actions(**kwargs)
    assert user.user_lists.count() == (1 if is_new else 0)
