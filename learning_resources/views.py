"""Views for learning_resources"""
import logging
from uuid import uuid4

from django.db.models import Q, QuerySet
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework_extensions.mixins import NestedViewSetMixin

from learning_resources import permissions
from learning_resources.constants import (
    LearningResourceType,
)
from learning_resources.models import LearningResource, LearningResourceRelationship
from learning_resources.permissions import is_learning_path_editor
from learning_resources.serializers import (
    LearningPathResourceSerializer,
    LearningResourceChildSerializer,
    LearningResourceSerializer,
    LearningPathRelationshipSerializer,
)
from learning_resources.utils import get_drf_nested_parent_id
from open_discussions.permissions import (
    AnonymousAccessReadonlyPermission,
    is_admin_user,
)

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
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "resource_type",
        "department__id",
        "platform",
        "offered_by__name",
    ]

    def _get_base_queryset(self, resource_type: str = None) -> QuerySet:
        """
        Return learning resources based on query parameters

        Args:
            resource_type (str): Resource type to filter by (default is None)

        Returns:
            QuerySet of LearningResource objects matching the query parameters
        """
        # Valid fields to filter by, just resource_type for now

        lr_query = LearningResource.objects.all()
        query_params_filter = {}
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
            "children",
            "children__child",
            "children__child__runs",
            "children__child__runs__instructors",
            "children__child__course",
            "children__child__program",
            "children__child__learning_path",
            "children__child__department",
            "children__child__platform",
            "children__child__topics",
            "children__child__image",
            "children__child__offered_by",
            "children__child__resource_content_tags",
        ]

        lr_query = lr_query.select_related(
            "image",
            "department",
            "platform",
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
        return self._get_base_queryset().filter(published=True)

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
        return self._get_base_queryset(
            resource_type=LearningResourceType.course.value
        ).filter(published=True)


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
        return self._get_base_queryset(
            resource_type=LearningResourceType.program.value
        ).filter(published=True)


class LearningPathViewSet(LearningResourceViewSet, viewsets.ModelViewSet):
    """
    Viewset for LearningPaths
    """

    serializer_class = LearningPathResourceSerializer
    permission_classes = (permissions.HasLearningPathPermissions,)

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Programs

        Returns:
            QuerySet of LearningResource objects that are Programs
        """
        queryset = self._get_base_queryset(
            resource_type=LearningResourceType.learning_path.value,
        )
        if not (is_learning_path_editor(self.request) or is_admin_user(self.request)):
            queryset = queryset.filter(published=True)
        return queryset

    def create(self, request, *args, **kwargs):
        request.data["readable_id"] = uuid4().hex
        request.data["resource_type"] = LearningResourceType.learning_path.value
        return super().create(request, *args, **kwargs)

    def perform_destroy(self, instance):
        # deindex_staff_list(instance.learning_resource)
        instance.delete()


class ResourceListItemsViewSet(NestedViewSetMixin, viewsets.ModelViewSet):
    """
    Viewset for LearningResource related resources
    """

    permission_classes = (AnonymousAccessReadonlyPermission,)
    serializer_class = LearningResourceChildSerializer
    queryset = (
        LearningResourceRelationship.objects.select_related("child")
        .prefetch_related(
            "child__runs",
            "child__runs__instructors",
        )
        .order_by("position")
    )
    pagination_class = DefaultPagination


class LearningPathItemsViewSet(ResourceListItemsViewSet):
    """
    Viewset for LearningPath related resources
    """

    serializer_class = LearningPathRelationshipSerializer
    permission_classes = (permissions.HasLearningPathItemPermissions,)

    def create(self, request, *args, **kwargs):
        request.data["parent"] = get_drf_nested_parent_id(kwargs)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        request.data["parent"] = get_drf_nested_parent_id(kwargs)
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        instance.delete()
        # Uncomment when search is ready
        # learning_path = instance.parent
        # if learning_path.items.count() > 0:
        #     upsert_staff_list(staff_list.id)
        # else:
        #     deindex_staff_list(staff_list)
