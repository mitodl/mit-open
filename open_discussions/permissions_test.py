"""Tests for permissions"""
import pytest
from django.contrib.auth.models import AnonymousUser

from open_discussions.permissions import (
    AnonymousAccessReadonlyPermission,
    IsOwnSubscriptionOrAdminPermission,
    IsStaffOrReadonlyPermission,
    IsStaffPermission,
    ObjectOnlyPermissions,
    is_readonly,
    is_admin_user,
)


@pytest.mark.parametrize(
    "method,result",
    [("GET", True), ("HEAD", True), ("OPTIONS", True), ("POST", False), ("PUT", False)],
)
def test_is_readonly(mocker, method, result):
    """is_readonly should return true for readonly HTTP verbs"""
    request = mocker.Mock(method=method)
    assert is_readonly(request) is result


@pytest.mark.parametrize(
    "has_user, is_staff, is_super, expected",
    [
        [False, False, False, False],
        [True, False, False, False],
        [True, True, False, True],
        [True, False, True, True],
    ],
)
def test_is_staff_user(
    mocker, user, staff_user, has_user, is_staff, is_super, expected
):  # pylint: disable=too-many-arguments
    """is_admin_user should return True if a valid JWT is provided"""
    request = mocker.Mock()
    if has_user:
        request.user = staff_user if is_staff else user
        request.user.is_superuser = is_super
    else:
        request.user = None
    assert is_admin_user(request) is expected


@pytest.mark.parametrize("is_staff", [True, False])
def test_is_staff_permission(mocker, is_staff):
    """
    Test that IsStaffPermission checks that the user is a staff user
    """
    request, view = mocker.Mock(), mocker.Mock()
    is_staff_user_mock = mocker.patch(
        "open_discussions.permissions.is_admin_user",
        autospec=True,
        return_value=is_staff,
    )
    assert IsStaffPermission().has_permission(request, view) is is_staff
    is_staff_user_mock.assert_called_once_with(request)


@pytest.mark.parametrize(
    "is_staff,readonly,expected",
    [
        [True, True, True],
        [True, False, True],
        [False, True, True],
        [False, False, False],
    ],
)
def test_is_staff_or_readonly_permission(mocker, is_staff, readonly, expected):
    """
    Test that staff users or readonly verbs are allowed
    """
    request, view = mocker.Mock(), mocker.Mock()
    is_staff_user_mock = mocker.patch(
        "open_discussions.permissions.is_admin_user",
        autospec=True,
        return_value=is_staff,
    )
    is_readonly_mock = mocker.patch(
        "open_discussions.permissions.is_readonly", autospec=True, return_value=readonly
    )
    assert IsStaffOrReadonlyPermission().has_permission(request, view) is expected
    if is_staff_user_mock.called:
        is_staff_user_mock.assert_called_once_with(request)
    is_readonly_mock.assert_called_once_with(request)


@pytest.mark.parametrize(
    "logged_in_username,req_body_username,url_kwarg_username,expected",
    [
        ["user1", "user1", None, True],
        ["user1", None, "user1", True],
        ["user1", "user1", None, True],
        ["otheruser", "user1", None, False],
        ["otheruser", None, "user1", False],
        ["user1", None, None, False],
    ],
)
def test_is_own_subscription_permission(
    mocker, logged_in_username, req_body_username, url_kwarg_username, expected
):
    """
    Test that IsOwnSubscriptionOrAdminPermission returns True if the user is adding/deleting
    their own resource
    """
    view = mocker.Mock(kwargs={"subscriber_name": url_kwarg_username})
    request = mocker.Mock(
        user=mocker.Mock(username=logged_in_username),
        data={"subscriber_name": req_body_username} if req_body_username else {},
    )
    mocker.patch("open_discussions.permissions.is_admin_user", return_value=False)
    mocker.patch("open_discussions.permissions.is_moderator", return_value=False)
    mocker.patch("open_discussions.permissions.is_readonly", return_value=False)
    assert (
        IsOwnSubscriptionOrAdminPermission().has_permission(request, view) is expected
    )


@pytest.mark.parametrize(
    "method,result",
    [("GET", True), ("HEAD", True), ("OPTIONS", True), ("POST", False), ("PUT", False)],
)
def test_anonymous_readonly(method, result, mocker):
    """
    Test that anonymous users are allowed for readonly verbs
    """
    perm = AnonymousAccessReadonlyPermission()
    request = mocker.Mock(user=AnonymousUser(), method=method)
    assert perm.has_permission(request, mocker.Mock()) is result


@pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS", "POST", "PUT"])
def test_not_anonymous(method, mocker):
    """
    Authenticated users are always allowed by this permission class
    """
    perm = AnonymousAccessReadonlyPermission()
    request = mocker.Mock(user=mocker.Mock(is_anonymous=False), method=method)
    assert perm.has_permission(request, mocker.Mock()) is True


def test_object_only_permissions(mocker):
    """Checks that ObjectOnlyPermissions.has_permission() returns True"""
    perm = ObjectOnlyPermissions()
    request = mocker.Mock(user=mocker.Mock(is_anonymous=False), method="PUT")
    assert perm.has_permission(request, mocker.Mock()) is True
