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

from learning_resources.permissions import is_learning_path_editor
from main.permissions import is_admin_user


def index(request, **kwargs):  # pylint: disable=unused-argument  # noqa: ARG001
    """Render the example app"""

    user = request.user

    js_settings = {
        "embedlyKey": settings.EMBEDLY_KEY,
        "ocw_next_base_url": settings.OCW_BASE_URL,
        "search_page_size": settings.OPENSEARCH_DEFAULT_PAGE_SIZE,
        "user": {
            "id": user.id,
            "first_name": getattr(user, "first_name", None),
            "last_name": getattr(user, "last_name", None),
            "is_authenticated": bool(user.is_authenticated),
            "is_learning_path_editor": user.is_authenticated
            and (is_admin_user(request) or is_learning_path_editor(request)),
            "is_article_editor": is_admin_user(request),
        },
        "ckeditor_upload_url": settings.CKEDITOR_UPLOAD_URL,
        "environment": settings.ENVIRONMENT,
        "sentry_dsn": settings.SENTRY_DSN,
        "release_version": settings.VERSION,
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
