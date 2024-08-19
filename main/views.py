"""
Base utility views. Handles errors and feature list views.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from main.features import get_all_feature_flags, is_enabled


@api_view()
@permission_classes([AllowAny])
def handle_error(
    request,  # noqa: ARG001
    exception=None,  # noqa: ARG001
):
    """Client Error"""

    # This is a generic handler, since the api_view decorator means DRF will
    # usurp error handling and provide whatever response is actually necessary.
    # There's a 404 here just as a fallback.

    return Response(
        {
            "detail": "The specified resource was not found.",
            "error_type": "Http404",
        },
        status=status.HTTP_404_NOT_FOUND,
    )


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
