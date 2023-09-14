"""View for search"""
import logging

from django.utils.decorators import method_decorator
from opensearchpy.exceptions import TransportError
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.decorators import blocked_ip_exempt
from learning_resources_search.api import execute_learn_search

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
class SearchView(ESView):
    """
    View for executing searches of posts, comments, profiles, learning resources
    """

    permission_classes = ()

    def post(self, request):
        """Execute a search. Despite being POST this should not modify any data."""
        response = execute_learn_search(query=request.data)
        return Response(response)
