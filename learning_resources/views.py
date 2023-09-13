"""Views for learning_resources"""
import logging
from uuid import uuid4

from django.db import transaction
from django.db.models import Count, F, Q, QuerySet
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework_extensions.mixins import NestedViewSetMixin

from learning_resources import permissions
from learning_resources.constants import LearningResourceType
from learning_resources.models import (
    ContentFile,
    LearningResource,
    LearningResourceRelationship,
    LearningResourceTopic,
    UserList,
    UserListRelationship,
)
from learning_resources.permissions import (
    HasUserListItemPermissions,
    HasUserListPermissions,
    is_learning_path_editor,
)
from learning_resources.serializers import (
    ContentFileSerializer,
    LearningPathRelationshipSerializer,
    LearningPathResourceSerializer,
    LearningResourceChildSerializer,
    LearningResourceSerializer,
    LearningResourceTopicSerializer,
    UserListRelationshipSerializer,
    UserListSerializer,
)
from open_discussions.permissions import (
    AnonymousAccessReadonlyPermission,
    is_admin_user,
)

log = logging.getLogger(__name__)


class DefaultPagination(LimitOffsetPagination):
    """
    Pagination class for learning_resources viewsets which gets default_limit and max_limit from settings
    """  # noqa: E501

    default_limit = 10
    max_limit = 100


class LargePagination(DefaultPagination):
    """Large pagination for small resources, e.g., topics."""

    default_limit = 1000
    max_limit = 1000


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

    def _get_base_queryset(self, resource_type: str | None = None) -> QuerySet:
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
        return lr_query.prefetch_related(*prefetches).distinct()

    def get_queryset(self) -> QuerySet:
        """
        Generate a QuerySet for fetching valid learning resources

        Returns:
            QuerySet of LearningResource objects
        """
        return self._get_base_queryset().filter(published=True)

    @extend_schema(responses=LearningResourceSerializer(many=True))
    @action(methods=["GET"], detail=False, name="New Resources")
    def new(self, request: Request) -> QuerySet:  # noqa: ARG002
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
    def upcoming(self, request: Request) -> QuerySet:  # noqa: ARG002
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


class VideoViewSet(LearningResourceViewSet):
    """
    Viewset for Videos
    """

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Videos

        Returns:
            QuerySet of LearningResource objects that are Videos
        """
        return self._get_base_queryset(
            resource_type=LearningResourceType.video.value
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
        instance.delete()


class NestedParentMixin(NestedViewSetMixin):
    """
    Mixin for nested viewsets that have a parent
    """

    def get_parent_id(self, id_field="parent_id"):
        """Get the parent id for the nested view request"""
        return self.get_parents_query_dict()[id_field]


class ResourceListItemsViewSet(NestedParentMixin, viewsets.ModelViewSet):
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
        request.data["parent"] = self.get_parent_id()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        request.data["parent"] = self.get_parent_id()
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        """Delete the relationship and update the positions of the remaining items"""
        with transaction.atomic():
            LearningResourceRelationship.objects.filter(
                parent=instance.parent,
                relation_type=instance.relation_type,
                position__gt=instance.position,
            ).update(position=F("position") - 1)
            instance.delete()


class TopicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for topics
    """

    queryset = LearningResourceTopic.objects.all()
    serializer_class = LearningResourceTopicSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)


class ContentFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for CpntentFiles
    """

    serializer_class = ContentFileSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)
    queryset = ContentFile.objects.filter(published=True).order_by("-updated_on")
    pagination_class = DefaultPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "run",
        "run__run_id",
        "run__learning_resource",
        "run__learning_resource__readable_id",
        "run__learning_resource__platform",
        "run__learning_resource__offered_by__name",
    ]


class LearningResourceContentFilesViewSet(NestedViewSetMixin, ContentFileViewSet):
    """
    Viewset for LearningResource nested ContentFiles
    """

    filterset_fields = ["run", "run__run_id"]

    def get_parent_id(self):
        """Get the parent learning resource id for the nested view request"""
        return self.get_parents_query_dict()["run__learning_resource"]


class UserListViewSet(NestedParentMixin, viewsets.ModelViewSet):
    """
    Viewset for UserLists
    """

    serializer_class = UserListSerializer
    pagination_class = DefaultPagination
    permission_classes = (HasUserListPermissions,)

    def get_queryset(self):
        """Return a queryset for this user"""
        return (
            UserList.objects.filter(author_id=self.request.user.id)
            .prefetch_related("author", "topics")
            .annotate(item_count=Count("children"))
        )

    def perform_destroy(self, instance):
        instance.delete()


class UserListItemViewSet(NestedParentMixin, viewsets.ModelViewSet):
    """
    Viewset for UserListRelationships
    """

    queryset = UserListRelationship.objects.prefetch_related("child").order_by(
        "position"
    )
    serializer_class = UserListRelationshipSerializer
    pagination_class = DefaultPagination
    permission_classes = (HasUserListItemPermissions,)

    def create(self, request, *args, **kwargs):
        user_list_id = self.get_parent_id()
        request.data["parent"] = user_list_id

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user_list_id = self.get_parent_id()
        request.data["parent"] = user_list_id
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        instance.delete()
        UserListRelationship.objects.filter(
            parent=instance.parent,
            position__gt=instance.position,
        ).update(position=F("position") - 1)
