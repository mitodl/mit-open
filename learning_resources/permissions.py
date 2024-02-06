"""
learning_resources permissions
"""

from django.http import HttpRequest
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import SAFE_METHODS, BasePermission

from learning_resources.constants import GROUP_STAFF_LISTS_EDITORS, PrivacyLevel
from learning_resources.models import LearningPath, UserList
from main.permissions import is_admin_user, is_readonly


def is_learning_path_editor(request: HttpRequest) -> bool:
    """
    Determine if a request user is a member of the staff list editors group.

    Args:
        request (HttpRequest): The request

    Returns:
        bool: True if request user is a staff list editor
    """
    return (
        request.user is not None
        and request.user.groups.filter(name=GROUP_STAFF_LISTS_EDITORS).first()
        is not None
    )


class HasLearningPathPermissions(BasePermission):
    """
    Permission to view/create/modify LearningPaths
    """

    def has_permission(self, request, view):  # noqa: ARG002
        return (
            is_readonly(request)
            or is_admin_user(request)
            or is_learning_path_editor(request)
        )

    def has_object_permission(self, request, view, obj):  # noqa: ARG002
        can_edit = is_learning_path_editor(request) or is_admin_user(request)
        if request.method in SAFE_METHODS:
            return obj.published or can_edit
        return can_edit


class HasLearningPathItemPermissions(BasePermission):
    """Permission to view/create/modify LearningPathItems"""

    def has_permission(self, request, view):
        learning_path = get_object_or_404(
            LearningPath,
            learning_resource_id=view.kwargs.get("learning_resource_id", None),
        )
        can_edit = is_learning_path_editor(request) or is_admin_user(request)
        if request.method in SAFE_METHODS:
            return learning_path.learning_resource.published or can_edit
        return can_edit

    def has_object_permission(self, request, view, obj):  # noqa: ARG002
        can_edit = is_learning_path_editor(request) or is_admin_user(request)
        if request.method in SAFE_METHODS:
            return obj.parent.published or can_edit
        return can_edit


class HasUserListPermissions(BasePermission):
    """Permission to view/modify UserLists"""

    def has_permission(self, request, view):  # noqa: ARG002
        if request.method in SAFE_METHODS:
            return True
        return not request.user.is_anonymous

    def has_object_permission(self, request, view, obj):  # noqa: ARG002
        if request.method in SAFE_METHODS:
            return (
                request.user == obj.author
                or obj.privacy_level == PrivacyLevel.unlisted.value
            )
        return request.user == obj.author


class HasUserListItemPermissions(BasePermission):
    """Permission to view/modify UserListItems"""

    def has_permission(self, request, view):
        user_list = get_object_or_404(
            UserList,
            id=view.kwargs.get("userlist_id", None),
        )
        if request.method in SAFE_METHODS:
            return (
                request.user == user_list.author
                or user_list.privacy_level == PrivacyLevel.unlisted.value
            )
        return request.user == user_list.author

    def has_object_permission(self, request, view, obj):  # noqa: ARG002
        if request.method in SAFE_METHODS:
            return (
                request.user == obj.parent.author
                or obj.parent.privacy_level == PrivacyLevel.unlisted.value
            )
        return request.user == obj.parent.author
