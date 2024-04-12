"""View for search"""

import logging
from itertools import chain

from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, extend_schema_view
from opensearchpy.exceptions import TransportError
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.decorators import blocked_ip_exempt
from learning_resources_search.api import (
    execute_learn_search,
    subscribe_user_to_search_query,
)
from learning_resources_search.constants import CONTENT_FILE_TYPE, LEARNING_RESOURCE
from learning_resources_search.serializers import (
    ContentFileeSearchResponseSerializer,
    ContentFileSearchRequestSerializer,
    LearningResourceSearchResponseSerializer,
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
            isinstance(exc.status_code, int) and 400 <= exc.status_code < 500  # noqa: PLR2004
        ):
            log.exception("Received a 4xx error from OpenSearch")
            return Response(status=exc.status_code)
        raise exc


@method_decorator(blocked_ip_exempt, name="dispatch")
@extend_schema_view(
    get=extend_schema(
        parameters=[LearningResourcesSearchRequestSerializer()],
        responses=LearningResourceSearchResponseSerializer(),
    ),
)
@action(methods=["GET"], detail=False, name="Search Learning Resources")
class LearningResourcesSearchView(ESView):
    """
    Search for learning resources
    """

    permission_classes = ()

    @extend_schema(summary="Search")
    def get(self, request):
        request_data = LearningResourcesSearchRequestSerializer(data=request.GET)

        if request_data.is_valid():
            response = execute_learn_search(
                request_data.data | {"endpoint": LEARNING_RESOURCE}
            )
            return Response(
                SearchResponseSerializer(response, context={"request": request}).data
            )
        else:
            errors = {}
            for key, errors_obj in request_data.errors.items():
                if isinstance(errors_obj, list):
                    errors[key] = errors_obj
                else:
                    errors[key] = list(set(chain(*errors_obj.values())))
            return Response(errors, status=400)


@method_decorator(blocked_ip_exempt, name="dispatch")
@extend_schema_view(
    get=extend_schema(
        parameters=[LearningResourcesSearchRequestSerializer()],
        responses=LearningResourceSearchResponseSerializer(),
    ),
)
@action(
    methods=["POST"], detail=False, name="Subscribe/Unsubscribe User to Search Query"
)
class SearchSubscriptionView(ESView):
    """
    Subscribe a user to a search query
    """

    permission_classes = (IsAuthenticated,)

    @extend_schema(summary="Search")
    def post(self, request):
        request_data = LearningResourcesSearchRequestSerializer(data=request.POST)

        if request_data.is_valid():
            response = subscribe_user_to_search_query(
                request.user, request_data.data | {"endpoint": LEARNING_RESOURCE}
            )
            return Response(response)
        else:
            errors = {}
            for key, errors_obj in request_data.errors.items():
                if isinstance(errors_obj, list):
                    errors[key] = errors_obj
                else:
                    errors[key] = list(set(chain(*errors_obj.values())))
            return Response(errors, status=400)


@method_decorator(blocked_ip_exempt, name="dispatch")
@extend_schema_view(
    get=extend_schema(
        parameters=[ContentFileSearchRequestSerializer()],
        responses=ContentFileeSearchResponseSerializer(),
    ),
)
@action(methods=["GET"], detail=False, name="Search Content Files")
class ContentFileSearchView(ESView):
    """
    Search for content files

    """

    permission_classes = ()

    @extend_schema(summary="Search")
    def get(self, request):
        request_data = ContentFileSearchRequestSerializer(data=request.GET)
        if request_data.is_valid():
            response = execute_learn_search(
                request_data.data | {"endpoint": CONTENT_FILE_TYPE}
            )
            return Response(
                SearchResponseSerializer(response, context={"request": request}).data
            )
        else:
            errors = {}
            for key, errors_obj in request_data.errors.items():
                if isinstance(errors_obj, list):
                    errors[key] = errors_obj
                else:
                    errors[key] = list(set(chain(*errors_obj.values())))

            return Response(errors, status=400)
