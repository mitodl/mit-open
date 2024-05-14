"""View for search"""

import logging
from itertools import chain

from django.utils.decorators import method_decorator
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from opensearchpy.exceptions import TransportError
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.decorators import blocked_ip_exempt
from learning_resources_search.api import (
    adjust_original_query_for_percolate,
    execute_learn_search,
    subscribe_user_to_search_query,
    unsubscribe_user_from_percolate_query,
)
from learning_resources_search.constants import CONTENT_FILE_TYPE, LEARNING_RESOURCE
from learning_resources_search.models import PercolateQuery
from learning_resources_search.serializers import (
    ContentFileSearchRequestSerializer,
    ContentFileSearchResponseSerializer,
    LearningResourceSearchResponseSerializer,
    LearningResourcesSearchRequestSerializer,
    PercolateQuerySerializer,
    PercolateQuerySubscriptionRequestSerializer,
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


@extend_schema_view(
    get=extend_schema(
        parameters=[LearningResourcesSearchRequestSerializer()],
        responses=PercolateQuerySerializer(),
    ),
    post=extend_schema(
        request=LearningResourcesSearchRequestSerializer(),
        responses=PercolateQuerySerializer(),
    ),
)
class UserSearchSubscriptionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    View for listing percolate query subscriptions for a user
    """

    permission_classes = (IsAuthenticated,)
    serializer_class = PercolateQuerySerializer
    http_method_names = ["get", "post", "delete"]

    @extend_schema(
        summary="List subscribed queries",
        parameters=[LearningResourcesSearchRequestSerializer],
        request=LearningResourcesSearchRequestSerializer(),
        responses=PercolateQuerySerializer(many=True),
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid PercolateQueries for this user

        Returns:
            QuerySet of PercolateQuery objects subscribed to by request user
        """
        queryset = self.request.user.percolate_queries.all()
        if len(self.request.query_params) > 0:
            request_data = LearningResourcesSearchRequestSerializer(
                data=self.request.query_params
            )
            if request_data.is_valid():
                adjusted_original_query = adjust_original_query_for_percolate(
                    request_data.data | {"endpoint": LEARNING_RESOURCE}
                )
                queryset = queryset.filter(
                    original_query__contains=adjusted_original_query
                )
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, view=self)
        return queryset

    @extend_schema(
        summary="Check if a user is subscribed to a specific query",
        parameters=[PercolateQuerySubscriptionRequestSerializer],
        responses=PercolateQuerySerializer(many=True),
    )
    @action(detail=False, methods=["GET"], name="Check if user is subscribed")
    def check(self, request):  # noqa: ARG002
        queryset = self.request.user.percolate_queries.all()
        if len(self.request.query_params) > 0:
            query_params = self.request.query_params
            percolate_serializer = PercolateQuerySubscriptionRequestSerializer(
                data=query_params
            )

            if percolate_serializer.is_valid():
                adjusted_original_query = adjust_original_query_for_percolate(
                    percolate_serializer.get_search_request_data()
                    | {"endpoint": LEARNING_RESOURCE}
                )
                queryset = queryset.filter(original_query=adjusted_original_query)
                if percolate_serializer.data.get("source_type"):
                    queryset = queryset.filter(
                        source_type=percolate_serializer.data["source_type"]
                    )
        return Response(PercolateQuerySerializer(queryset, many=True).data)

    @extend_schema(
        summary="Subscribe user to query",
        parameters=[PercolateQuerySubscriptionRequestSerializer],
        request=PercolateQuerySubscriptionRequestSerializer(),
        responses=PercolateQuerySerializer(),
    )
    @action(detail=False, methods=["post"], name="Subscribe user to query")
    @action(detail=False, methods=["POST"], name="Subscribe user to query")
    def subscribe(self, request, *args, **kwargs):  # noqa: ARG002
        """
        Subscribe a user to query
        """
        query_data = request.data
        percolate_serializer = PercolateQuerySubscriptionRequestSerializer(
            data=query_data
        )
        if percolate_serializer.is_valid():
            percolate_query = subscribe_user_to_search_query(
                request.user,
                percolate_serializer.get_search_request_data()
                | {"endpoint": LEARNING_RESOURCE},
                source_type=percolate_serializer.data.get("source_type"),
            )
            return Response(PercolateQuerySerializer(percolate_query).data)
        else:
            errors = {}
            for key, errors_obj in percolate_serializer.errors.items():
                if isinstance(errors_obj, list):
                    errors[key] = errors_obj
                else:
                    errors[key] = list(set(chain(*errors_obj.values())))
            return Response(errors, status=400)

    @extend_schema(
        summary="Unsubscribe user from query",
        parameters=[
            OpenApiParameter(name="id", type=int, location=OpenApiParameter.PATH),
        ],
        responses=PercolateQuerySerializer(),
    )
    @action(
        detail=True,
        methods=["DELETE"],
        name="Unsubscribe user from query by id",
    )
    def unsubscribe(self, request, pk: int):
        """
        Unsubscribe a user from a query

        Args:
        pk (integer): The id of the query

        Returns:
        PercolateQuerySerializer: The percolate query
        """

        percolate_query = get_object_or_404(PercolateQuery, id=pk)
        unsubscribe_user_from_percolate_query(request.user, percolate_query)
        return Response(
            PercolateQuerySerializer(percolate_query).data["original_query"]
        )


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
