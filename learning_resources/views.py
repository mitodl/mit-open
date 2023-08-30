"""Views for learning_resources"""
import logging

from django.db.models import Q, QuerySet
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request

from learning_resources.constants import LearningResourceType
from learning_resources.models import LearningResource
from learning_resources.serializers import LearningResourceSerializer
from open_discussions.permissions import AnonymousAccessReadonlyPermission

log = logging.getLogger(__name__)


class DefaultPagination(LimitOffsetPagination):
    """
    Pagination class for course_catalog viewsets which gets default_limit and max_limit from settings
    """

    default_limit = 10
    max_limit = 100


@extend_schema_view(
    list=extend_schema(
        summary="List",
        description="Get a paginated list of learning resources.",
    ),
    retrieve=extend_schema(
        summary="Retrieve",
        description="Retrieve a single learning resource.",
    ),
    new=extend_schema(
        summary="List New",
        description="Get a paginated list of newly released resources.",
    ),
    upcoming=extend_schema(
        summary="List Upcoming",
        description="Get a paginated list of upcoming resources.",
    ),
)
class LearningResourceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for LearningResources
    """

    serializer_class = LearningResourceSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)
    pagination_class = DefaultPagination

    def _get_base_queryset(self, resource_type: str = None) -> QuerySet:
        """
        Return learning resources based on query parameters

        Args:
            resource_type (str): Resource type to filter by (default is None)

        Returns:
            QuerySet of LearningResource objects matching the query parameters
        """
        # Valid fields to filter by, just resource_type for now
        valid_params = ["resource_type"]

        lr_query = LearningResource.objects.filter(
            published=True,
        )
        query_params_filter = {}
        for param in self.request.query_params:
            for valid_param in valid_params:
                if param.startswith(valid_param):
                    query_params_filter[param] = self.request.query_params[param]
        if query_params_filter != {}:
            lr_query = lr_query.filter(Q(**query_params_filter))
        if resource_type:
            lr_query = lr_query.filter(resource_type=resource_type)
        prefetches = [
            "topics",
            "offered_by",
            "resource_content_tags",
            "runs",
            "runs__instructors",
            "runs__image",
        ]
        if resource_type == LearningResourceType.program.value:
            prefetches.extend(
                [
                    "program__courses__topics",
                    "program__courses__image",
                    "program__courses__offered_by",
                    "program__courses__resource_content_tags",
                ]
            )

        lr_query = lr_query.select_related(
            "image",
            "department",
            *([item.value for item in LearningResourceType]),
        )
        lr_query = lr_query.prefetch_related(*prefetches).distinct()
        return lr_query

    def get_queryset(self) -> QuerySet:
        """
        Generate a QuerySet for fetching valid learning resources

        Returns:
            QuerySet of LearningResource objects
        """
        return self._get_base_queryset()

    @extend_schema(responses=LearningResourceSerializer(many=True))
    @action(methods=["GET"], detail=False, name="New Resources")
    def new(self, request: Request) -> QuerySet:
        """
        Get new LearningResources

        Returns:
            QuerySet of LearningResource objects ordered by reverse created_on
        """
        page = self.paginate_queryset(self.get_queryset().order_by("-created_on"))
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @extend_schema(responses=LearningResourceSerializer(many=True))
    @action(methods=["GET"], detail=False, name="Upcoming Resources")
    def upcoming(self, request: Request) -> QuerySet:
        """
        Get upcoming LearningResources

        Args:
            request(Request): The request object

        Returns:
            QuerySet of LearningResource objects with future runs

        """
        page = self.paginate_queryset(
            self._get_base_queryset()
            .filter(
                Q(runs__published=True)
                & (
                    Q(runs__start_date__gt=timezone.now())
                    | Q(runs__enrollment_start__gt=timezone.now())
                )
            )
            .order_by("runs__start_date")
        )
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class CourseViewSet(LearningResourceViewSet):
    """
    Viewset for Courses
    """

    def get_queryset(self) -> QuerySet:
        """
        Generate a QuerySet for fetching valid Course objects

        Returns:
            QuerySet of LearningResource objects that are Courses
        """
        return self._get_base_queryset(resource_type=LearningResourceType.course.value)


class ProgramViewSet(LearningResourceViewSet):
    """
    Viewset for Programs
    """

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Programs

        Returns:
            QuerySet of LearningResource objects that are Programs
        """
        return self._get_base_queryset(resource_type=LearningResourceType.program.value)
