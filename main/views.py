"""
main views
"""

from django.http import (
    HttpResponseBadRequest,
    HttpResponseForbidden,
    HttpResponseNotFound,
)
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from main.features import get_all_feature_flags, is_enabled


def index(request, **kwargs):  # pylint: disable=unused-argument  # noqa: ARG001
    """
    Return the static HTML index file for our react app.

    In general, this should not be served by Django, but directly by nginx or
    another web server. However, if a route that nginx sends to Django is a 404,
    then we return the react app via Django.
    """
    return render(request, "index.html")


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

    def list(self, request):  # noqa: ARG002
        """
        Return a list of all feature flags.
        """
        return Response(get_all_feature_flags())

    def retrieve(self, request, pk=None):  # noqa: ARG002
        """
        Return a single feature_flag, specified by its ID.
        """
        return Response(is_enabled(pk))
