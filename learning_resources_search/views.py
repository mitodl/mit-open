"""View for search"""

import logging

from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, extend_schema_view
from opensearchpy.exceptions import TransportError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.decorators import blocked_ip_exempt
from learning_resources_search.api import execute_learn_search
from learning_resources_search.serializers import (
    ContentFileSearchRequestSerializer,
    LearningResourcesSearchRequestSerializer,
    SearchResponseSerializer,
)

log = logging.getLogger(__name__)


class ESView(APIView):
    """
    Parent class for views that execute ES searches
    """

    def handle_exception(self, exc):
        if isinstance(exc, TransportError) and (
            isinstance(exc.status_code, int)
            and 400 <= exc.status_code < 500  # noqa: PLR2004
        ):
            log.exception("Received a 4xx error from OpenSearch")
            return Response(status=exc.status_code)
        raise exc


@method_decorator(blocked_ip_exempt, name="dispatch")
@extend_schema_view(
    get=extend_schema(
        parameters=[LearningResourcesSearchRequestSerializer()],
        responses=SearchResponseSerializer(),
    ),
)
@action(methods=["GET"], detail=False, name="Search Learning Resources")
class LearningResourcesSearchView(ESView):
    """
    View for executing searches of learning resources
    """

    permission_classes = ()

    def get(self, request):
        request_data = LearningResourcesSearchRequestSerializer(data=request.GET)
        if request_data.is_valid():
            response = execute_learn_search(request_data.data)
            return Response(SearchResponseSerializer(response).data)
        else:
            return Response(request_data.errors, status=400)


@method_decorator(blocked_ip_exempt, name="dispatch")
@extend_schema_view(
    get=extend_schema(
        parameters=[ContentFileSearchRequestSerializer()],
        responses=SearchResponseSerializer(),
    ),
)
@action(methods=["GET"], detail=False, name="Search Content Files")
class ContentFileSearchView(ESView):
    """
    View for executing searches of learning resources
    """

    permission_classes = ()

    def get(self, request):
        request_data = ContentFileSearchRequestSerializer(data=request.GET)

        if request_data.is_valid():
            response = execute_learn_search(request_data.data)
            return Response(SearchResponseSerializer(response).data)
        else:
            return Response(request_data.errors, status=400)
