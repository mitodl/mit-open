"""View for search"""
import logging

from django.utils.decorators import method_decorator
from opensearchpy.exceptions import TransportError
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.decorators import blocked_ip_exempt
from search.api import (
    execute_learn_search,
    execute_search,
    find_similar_resources,
    is_learning_query,
)

log = logging.getLogger(__name__)


class ESView(APIView):
    """
    Parent class for views that execute ES searches
    """

    def handle_exception(self, exc):
        if isinstance(exc, TransportError):
            if isinstance(exc.status_code, int) and 400 <= exc.status_code < 500:
                log.exception("Received a 4xx error from OpenSearch")
                return Response(status=exc.status_code)
        raise exc


@method_decorator(blocked_ip_exempt, name="dispatch")
class SearchView(ESView):
    """
    View for executing searches of profiles, learning resources
    """

    permission_classes = ()

    def post(self, request, *args, **kwargs):
        """Execute a search. Despite being POST this should not modify any data."""
        query = request.data
        if is_learning_query(query):
            response = execute_learn_search(user=request.user, query=request.data)
        else:
            response = execute_search(user=request.user, query=request.data)
        return Response(response)


@method_decorator(blocked_ip_exempt, name="dispatch")
class SimilarResourcesView(ESView):
    """
    View for retrieving similar learning resources
    """

    permission_classes = ()

    def post(self, request, *args, **kwargs):
        """Execute a similar resources search"""
        response = find_similar_resources(user=request.user, value_doc=request.data)
        return Response(response)
