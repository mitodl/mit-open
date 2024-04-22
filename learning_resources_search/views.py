"""View for search"""

import logging
from itertools import chain

from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, extend_schema_view
from opensearchpy.exceptions import TransportError
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.decorators import blocked_ip_exempt
from learning_resources_search.api import (
    execute_learn_search,
    subscribe_user_to_search_query,
    unsubscribe_user_from_percolate_query,
    unsubscribe_user_from_search_query,
)
from learning_resources_search.constants import CONTENT_FILE_TYPE, LEARNING_RESOURCE
from learning_resources_search.models import PercolateQuery
from learning_resources_search.serializers import (
    ContentFileSearchRequestSerializer,
    ContentFileSearchResponseSerializer,
    LearningResourceSearchResponseSerializer,
    LearningResourcesSearchRequestSerializer,
    PercolateQuerySerializer,
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


class UserSearchSubscriptionViewSet(viewsets.ModelViewSet):
    """
    View for listing percolate query subscriptions for a user
    """

    permission_classes = (IsAuthenticated,)
    serializer_class = PercolateQuerySerializer

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid PercolateQueries for this user

        Returns:
            QuerySet of PercolateQuery objects subscribed to by request user
        """
        queryset = self.request.user.percolate_queries.all()
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, view=self)
        return queryset

    @action(detail=False, methods=["post"], name="Subscribe user to query")
    @extend_schema(
        summary="Subscribe user to query",
        parameters=[LearningResourcesSearchRequestSerializer()],
        responses=PercolateQuerySerializer(),
    )
    def subscribe(self, request, *args, **kwargs):  # noqa: ARG002
        request_data = LearningResourcesSearchRequestSerializer(data=request.data)
        if request_data.is_valid():
            percolate_query = subscribe_user_to_search_query(
                request.user, request_data.data | {"endpoint": LEARNING_RESOURCE}
            )
            return Response(PercolateQuerySerializer(percolate_query).data)
        else:
            errors = {}
            for key, errors_obj in request_data.errors.items():
                if isinstance(errors_obj, list):
                    errors[key] = errors_obj
                else:
                    errors[key] = list(set(chain(*errors_obj.values())))
            return Response(errors, status=400)

    @action(
        detail=True,
        methods=["POST"],
        url_path="unsubscribe",
        name="Unsubscribe user from query by id",
    )
    @extend_schema(
        summary="Unsubscribe user to query",
        parameters=[LearningResourcesSearchRequestSerializer()],
        responses=PercolateQuerySerializer(),
    )
    def unsubscribe(self, request, pk=None):
        percolate_query = get_object_or_404(PercolateQuery, id=pk)
        unsubscribe_user_from_percolate_query(request.user, percolate_query)
        return Response(PercolateQuerySerializer(percolate_query).data)

    @action(
        detail=False,
        methods=["POST"],
        url_path="unsubscribe",
        name="Unsubscribe user from query",
    )
    @extend_schema(
        summary="Unsubscribe user to query",
        parameters=[LearningResourcesSearchRequestSerializer()],
        responses=PercolateQuerySerializer(),
    )
    def unsubscribe_user(self, request):
        request_data = LearningResourcesSearchRequestSerializer(data=request.data)
        if request_data.is_valid():
            percolate_query = unsubscribe_user_from_search_query(
                request.user, request_data.data | {"endpoint": LEARNING_RESOURCE}
            )
            return Response(PercolateQuerySerializer(percolate_query).data)
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
        responses=ContentFileSearchResponseSerializer(),
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
