"""Embed.ly views"""

from urllib.parse import unquote

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from embedly.api import get_embedly_summary
from main.permissions import AnonymousAccessReadonlyPermission


@api_view()
@permission_classes([AnonymousAccessReadonlyPermission])
def embedly_view(request, **kwargs):  # pylint: disable=unused-argument  # noqa: ARG001
    """Get Embedly API, return the JSON"""
    if settings.EMBEDLY_KEY:
        url = unquote(unquote(kwargs["url"]))
        response = get_embedly_summary(url).json()
        return Response(response)
    else:
        return Response({}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
