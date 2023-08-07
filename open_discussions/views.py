"""
open_discussions views
"""
from django.http import (
    Http404,
    HttpResponse,
    HttpResponseNotFound,
    HttpResponseForbidden,
    HttpResponseBadRequest,
)
from django.conf import settings
from django.shortcuts import render
from django.urls import reverse
from social_django.utils import load_strategy, load_backend

from open_discussions import features
from open_discussions.permissions import is_admin_user

from course_catalog.permissions import is_staff_list_editor

from moira_lists.moira_api import is_public_list_editor


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
            "is_public_list_editor": user.is_authenticated
            and is_public_list_editor(user),
            "is_staff_list_editor": user.is_authenticated
            and (is_admin_user(request) or is_staff_list_editor(request)),
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


def saml_metadata(request):
    """Display SAML configuration metadata as XML"""
    if not features.is_enabled(features.SAML_AUTH):
        raise Http404("Page not found")
    complete_url = reverse("social:complete", args=("saml",))
    saml_backend = load_backend(
        load_strategy(request), "saml", redirect_uri=complete_url
    )
    metadata, _ = saml_backend.generate_metadata_xml()
    return HttpResponse(content=metadata, content_type="text/xml")
