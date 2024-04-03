"""
main views
"""

from django.conf import settings
from django.http import (
    HttpResponseBadRequest,
    HttpResponseForbidden,
    HttpResponseNotFound,
)
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from learning_resources.permissions import is_learning_path_editor
from main.features import get_all_feature_flags, is_enabled
from main.permissions import is_admin_user


def index(request, **kwargs):  # pylint: disable=unused-argument  # noqa: ARG001
    """Render the example app"""

    user = request.user
    all_flags = get_all_feature_flags(user.username if user.is_authenticated else None)

    js_settings = {
        "user": {
            "id": user.id,
            "first_name": getattr(user, "first_name", None),
            "last_name": getattr(user, "last_name", None),
            "is_authenticated": bool(user.is_authenticated),
            "is_learning_path_editor": user.is_authenticated
            and (is_admin_user(request) or is_learning_path_editor(request)),
            "is_article_editor": is_admin_user(request),
        },
        "posthog": {
            "api_key": settings.POSTHOG_PROJECT_API_KEY,
            "enabled": settings.POSTHOG_ENABLED,
            "timeout": settings.POSTHOG_TIMEOUT_MS,
            "bootstrap_flags": all_flags,
        },
    }

    return render(request, "index.html", context={"js_settings": js_settings})


def handle_400(
    request,
    exception=None,  # noqa: ARG001
):
    """400 error handler"""
    return HttpResponseBadRequest(index(request))


def handle_403(
    request,
    exception=None,  # noqa: ARG001
):
    """403 error handler"""
    return HttpResponseForbidden(index(request))


def handle_404(
    request,
    exception=None,  # noqa: ARG001
):
    """404 error handler"""
    return HttpResponseNotFound(index(request))


class FeaturesViewSet(ViewSet):
    """
    View for getting the currently available feature flags
    """

    def list(self, request):  # noqa: ARG002, A003
        """
        Return a list of all feature flags.
        """
        return Response(get_all_feature_flags())

    def retrieve(self, request, pk=None):  # noqa: ARG002
        """
        Return a single feature_flag, specified by its ID.
        """
        return Response(is_enabled(pk))
