"""
open_discussions views
"""
from django.http import (
    HttpResponseNotFound,
    HttpResponseForbidden,
    HttpResponseBadRequest,
)
from django.conf import settings
from django.shortcuts import render
from learning_resources.permissions import is_learning_path_editor

from open_discussions.permissions import is_admin_user

from course_catalog.permissions import is_staff_list_editor


def index(request, **kwargs):  # pylint: disable=unused-argument
    """Render the example app"""

    user = request.user

    js_settings = {
        "embedlyKey": settings.EMBEDLY_KEY,
        "ocw_next_base_url": settings.OCW_NEXT_BASE_URL,
        "search_page_size": settings.OPENSEARCH_DEFAULT_PAGE_SIZE,
        "user": {
            "id": user.id,
            "is_authenticated": bool(user.is_authenticated),
            "is_staff_list_editor": user.is_authenticated
            and (is_admin_user(request) or is_staff_list_editor(request)),
            "is_learning_path_editor": user.is_authenticated
            and (is_admin_user(request) or is_learning_path_editor(request)),
        },
        "ckeditor_upload_url": settings.CKEDITOR_UPLOAD_URL,
        "environment": settings.ENVIRONMENT,
        "sentry_dsn": settings.SENTRY_DSN,
        "release_version": settings.VERSION,
    }

    return render(request, "index.html", context=dict(js_settings=js_settings))


def handle_400(request, exception=None):  # pylint:disable=unused-argument
    """400 error handler"""
    return HttpResponseBadRequest(index(request))


def handle_403(request, exception=None):  # pylint:disable=unused-argument
    """403 error handler"""
    return HttpResponseForbidden(index(request))


def handle_404(request, exception=None):  # pylint:disable=unused-argument
    """404 error handler"""
    return HttpResponseNotFound(index(request))
