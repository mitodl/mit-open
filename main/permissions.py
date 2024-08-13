"""Custom permissions"""

from rest_framework import permissions


def is_admin_user(request):
    """
    Args:
        request (HTTPRequest): django request object

    Returns:
        bool: True if user is staff/admin
    """
    return request.user is not None and (
        request.user.is_staff or request.user.is_superuser
    )


def is_moderator(request, view):
    """
    Helper function to check if a user is a moderator

    Args:
        request (HTTPRequest): django request object
        view (APIView): a DRF view object

    Returns:
        bool: True if user is moderator on the channel
    """  # noqa: D401
    user_api = request.channel_api
    channel_name = view.kwargs.get("channel_name", None)
    return (
        channel_name
        and not request.user.is_anonymous
        and user_api.is_moderator(channel_name, request.user.username)
    )


def is_readonly(request):
    """
    Returns True if the request uses a readonly verb

    Args:
        request (HTTPRequest): A request

    Returns:
        bool: True if the request method is readonly
    """  # noqa: D401
    return request.method in permissions.SAFE_METHODS


class IsStaffPermission(permissions.BasePermission):
    """Checks the user for the staff permission"""

    def has_permission(self, request, view):  # noqa: ARG002
        """Returns True if the user has the staff role"""  # noqa: D401
        return is_admin_user(request)


class IsStaffOrReadonlyPermission(permissions.BasePermission):
    """Checks the user for the staff permission"""

    def has_permission(self, request, view):  # noqa: ARG002
        """Returns True if the user has the staff role or if the request is readonly"""  # noqa: D401
        return is_readonly(request) or is_admin_user(request)


class IsOwnSubscriptionOrAdminPermission(permissions.BasePermission):
    """
    Checks that the user is (1) staff/moderator, (2) editing their own subscription, or (3) making
    a readonly request
    """  # noqa: E501

    @staticmethod
    def is_own_resource_request(request, view):
        """Returns True if the request is on the user's own behalf"""  # noqa: D401
        resource_owner_username = view.kwargs.get(
            "subscriber_name", None
        ) or request.data.get("subscriber_name", None)
        return resource_owner_username == request.user.username

    def has_permission(self, request, view):
        """
        Returns True if user is (1) staff/moderator, (2) editing their own subscription, or (3) making
        a readonly request
        """  # noqa: E501, D401
        return (
            is_readonly(request)
            or self.is_own_resource_request(request, view)
            or is_admin_user(request)
            or is_moderator(request, view)
        )


class AnonymousAccessReadonlyPermission(permissions.BasePermission):
    """Checks that the user is authenticated or is allowed anonymous access"""

    def has_permission(self, request, view):  # noqa: ARG002
        """Is the user authenticated or allowed anonymous access?"""
        return not (request.user.is_anonymous and not is_readonly(request))


class ReadOnly(permissions.BasePermission):
    """Allows read-only requests through for any user"""

    def has_permission(self, request, view):  # noqa: ARG002
        """Return true if the request is read-only"""
        return request.method in permissions.SAFE_METHODS


class ObjectOnlyPermissions(permissions.DjangoObjectPermissions):
    """Validates only object-level permissions"""

    # NOTE: this is because DjangoObjectPermissions subclasses DjangoModelPermissions, which also checks permissions on models  # noqa: E501

    def has_permission(self, request, view):  # noqa: ARG002
        """Ignores model-level permissions"""
        return True
