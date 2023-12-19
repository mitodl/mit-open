"""Views for learning_resources"""

import logging
from hmac import compare_digest

import rapidjson
from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Q, QuerySet
from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import views, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.generics import GenericAPIView, get_object_or_404
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_extensions.mixins import NestedViewSetMixin

from authentication.decorators import blocked_ip_exempt
from learning_resources import permissions
from learning_resources.constants import (
    LearningResourceType,
    PlatformType,
    PrivacyLevel,
)
from learning_resources.etl.podcast import generate_aggregate_podcast_rss
from learning_resources.exceptions import WebhookException
from learning_resources.filters import ContentFileFilter, LearningResourceFilter
from learning_resources.models import (
    ContentFile,
    LearningResource,
    LearningResourceContentTag,
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourcePlatform,
    LearningResourceRelationship,
    LearningResourceRun,
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
    CourseResourceSerializer,
    LearningPathRelationshipSerializer,
    LearningPathResourceSerializer,
    LearningResourceChildSerializer,
    LearningResourceContentTagSerializer,
    LearningResourceDepartmentSerializer,
    LearningResourceOfferorSerializer,
    LearningResourcePlatformSerializer,
    LearningResourceSerializer,
    LearningResourceTopicSerializer,
    PodcastEpisodeResourceSerializer,
    PodcastResourceSerializer,
    ProgramResourceSerializer,
    UserListRelationshipSerializer,
    UserListSerializer,
)
from learning_resources.tasks import get_ocw_courses
from learning_resources.utils import resource_unpublished_actions
from open_discussions.constants import VALID_HTTP_METHODS
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
)
class BaseLearningResourceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for LearningResources
    """

    permission_classes = (AnonymousAccessReadonlyPermission,)
    pagination_class = DefaultPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = LearningResourceFilter

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
        if resource_type:
            lr_query = lr_query.filter(resource_type=resource_type)
        lr_query = lr_query.select_related(*LearningResource.related_selects)
        return lr_query.prefetch_related(*LearningResource.prefetches).distinct()

    def get_queryset(self) -> QuerySet:
        """
        Generate a QuerySet for fetching valid learning resources

        Returns:
            QuerySet of LearningResource objects
        """
        return self._get_base_queryset().filter(published=True)


class NewResourcesViewSetMixin(GenericAPIView):
    """ViewSet mixin for adding new resource functionality."""

    resource_type_name_plural: str

    def __init_subclass__(cls) -> None:
        """Initialize subclasses by updating the view with the correct serializer."""
        name = cls.resource_type_name_plural
        # this decorator mutates the view in place so the return value is safely ignored
        extend_schema_view(
            new=extend_schema(
                description=f"Get a paginated list of newly released {name}.",
                responses=cls.serializer_class(many=True),
            ),
        )(cls)
        super().__init_subclass__()

    @extend_schema(summary="List New")
    @action(methods=["GET"], detail=False, name="New Resources")
    def new(self, request: Request) -> QuerySet:  # noqa: ARG002
        page = self.paginate_queryset(self.get_queryset().order_by("-created_on"))
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class UpcomingResourcesViewSetMixin(GenericAPIView):
    """ViewSet mixin for adding upcoming resource functionality."""

    resource_type_name_plural: str

    def __init_subclass__(cls) -> None:
        """Initialize subclasses by updating the view with the correct serializer."""
        name = cls.resource_type_name_plural
        # this decorator mutates the view in place so the return value is safely ignored
        extend_schema_view(
            upcoming=extend_schema(
                description=f"Get a paginated list of upcoming {name}.",
                responses=cls.serializer_class(many=True),
            ),
        )(cls)
        super().__init_subclass__()

    @extend_schema(summary="List Upcoming")
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


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of learning resources.",
    ),
    retrieve=extend_schema(
        description="Retrieve a single learning resource.",
    ),
)
class LearningResourceViewSet(
    BaseLearningResourceViewSet, UpcomingResourcesViewSetMixin, NewResourcesViewSetMixin
):
    """
    Viewset for LearningResources
    """

    resource_type_name_plural = "Learning Resources"
    serializer_class = LearningResourceSerializer


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of courses",
    ),
    retrieve=extend_schema(
        description="Retrieve a single course",
    ),
)
class CourseViewSet(
    BaseLearningResourceViewSet, NewResourcesViewSetMixin, UpcomingResourcesViewSetMixin
):
    """
    Viewset for Courses
    """

    resource_type_name_plural = "Courses"

    serializer_class = CourseResourceSerializer

    def get_queryset(self) -> QuerySet:
        """
        Generate a QuerySet for fetching valid Course objects

        Returns:
            QuerySet of LearningResource objects that are Courses
        """
        return self._get_base_queryset(
            resource_type=LearningResourceType.course.name
        ).filter(published=True)


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of programs",
    ),
    retrieve=extend_schema(
        description="Retrieve a single program",
    ),
)
class ProgramViewSet(
    BaseLearningResourceViewSet, UpcomingResourcesViewSetMixin, NewResourcesViewSetMixin
):
    """
    Viewset for Programs
    """

    resource_type_name_plural = "Programs"

    serializer_class = ProgramResourceSerializer

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Programs

        Returns:
            QuerySet of LearningResource objects that are Programs
        """
        return self._get_base_queryset(
            resource_type=LearningResourceType.program.name
        ).filter(published=True)


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of podcasts",
    ),
    retrieve=extend_schema(
        description="Retrieve a single podcast",
    ),
)
class PodcastViewSet(BaseLearningResourceViewSet):
    """
    Viewset for Podcasts
    """

    serializer_class = PodcastResourceSerializer

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Programs

        Returns:
            QuerySet of LearningResource objects that are Programs
        """
        return self._get_base_queryset(
            resource_type=LearningResourceType.podcast.name
        ).filter(published=True)


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of podcast episodes",
    ),
    retrieve=extend_schema(
        description="Retrieve a single podcast episode",
    ),
)
class PodcastEpisodeViewSet(BaseLearningResourceViewSet):
    """
    Viewset for Podcast Episodes
    """

    serializer_class = PodcastEpisodeResourceSerializer

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Programs

        Returns:
            QuerySet of LearningResource objects that are Programs
        """
        return self._get_base_queryset(
            resource_type=LearningResourceType.podcast_episode.name
        ).filter(published=True)


@extend_schema_view(
    list=extend_schema(
        summary="List", description="Get a paginated list of learning paths"
    ),
    retrieve=extend_schema(
        summary="Retrieve", description="Retrive a single learning path"
    ),
    create=extend_schema(summary="Create", description="Create a learning path"),
    destroy=extend_schema(summary="Destroy", description="Remove a learning path"),
    partial_update=extend_schema(
        summary="Update",
        description="Update individual fields of a learning path",
    ),
)
class LearningPathViewSet(BaseLearningResourceViewSet, viewsets.ModelViewSet):
    """
    Viewset for LearningPaths
    """

    serializer_class = LearningPathResourceSerializer
    permission_classes = (permissions.HasLearningPathPermissions,)
    http_method_names = VALID_HTTP_METHODS

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Programs

        Returns:
            QuerySet of LearningResource objects that are Programs
        """
        queryset = self._get_base_queryset(
            resource_type=LearningResourceType.learning_path.name,
        )
        if not (is_learning_path_editor(self.request) or is_admin_user(self.request)):
            queryset = queryset.filter(published=True)
        return queryset

    def perform_destroy(self, instance):
        instance.delete()


class NestedParentMixin(NestedViewSetMixin):
    """
    Mixin for nested viewsets that have a parent
    """

    def get_parent_id(self, id_field="parent_id"):
        """Get the parent id for the nested view request"""
        return self.get_parents_query_dict()[id_field]


@extend_schema_view(
    list=extend_schema(
        summary="Nested Learning Resource List",
        description="Get a list of related learning resources for a learning resource.",
    ),
    retrieve=extend_schema(
        summary="Nested Learning Resource Retrieve",
        description="Get a singe related learning resource for a learning resource.",
    ),
)
class ResourceListItemsViewSet(NestedParentMixin, viewsets.ReadOnlyModelViewSet):
    """
    Viewset for nested learning resources.

    """

    permission_classes = (AnonymousAccessReadonlyPermission,)
    serializer_class = LearningResourceChildSerializer
    pagination_class = DefaultPagination
    queryset = (
        LearningResourceRelationship.objects.select_related("child")
        .prefetch_related(
            "child__runs",
            "child__runs__instructors",
        )
        .filter(child__published=True)
    )
    filter_backends = [OrderingFilter]
    ordering = ["position", "-child__last_modified"]


@extend_schema_view(
    create=extend_schema(summary="Learning Path Resource Relationship Add"),
    destroy=extend_schema(summary="Learning Path Resource Relationship Remove"),
    partial_update=extend_schema(summary="Learning Path Resource Relationship Update"),
)
class LearningPathItemsViewSet(ResourceListItemsViewSet, viewsets.ModelViewSet):
    """
    Viewset for LearningPath related resources
    """

    serializer_class = LearningPathRelationshipSerializer
    permission_classes = (permissions.HasLearningPathItemPermissions,)
    http_method_names = VALID_HTTP_METHODS

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


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
)
class TopicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Topics covered by learning resources
    """

    queryset = LearningResourceTopic.objects.all().order_by("name")
    serializer_class = LearningResourceTopicSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
)
class ContentFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for ContentFiles
    """

    serializer_class = ContentFileSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)
    queryset = ContentFile.objects.filter(published=True).order_by("-updated_on")
    pagination_class = DefaultPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ContentFileFilter


@extend_schema_view(
    list=extend_schema(
        summary="Learning Resource Content File List",
    ),
    retrieve=extend_schema(
        summary="Learning Resource Content File Retrieve",
    ),
)
class LearningResourceContentFilesViewSet(NestedViewSetMixin, ContentFileViewSet):
    """
    Show content files for a learning resource
    """

    filterset_fields = ["run", "run__run_id"]

    def get_parent_id(self):
        """Get the parent learning resource id for the nested view request"""
        return self.get_parents_query_dict()["run__learning_resource"]


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
    create=extend_schema(summary="Create"),
    destroy=extend_schema(summary="Destroy"),
    partial_update=extend_schema(summary="Update"),
)
class UserListViewSet(NestedParentMixin, viewsets.ModelViewSet):
    """
    Viewset for UserLists
    """

    serializer_class = UserListSerializer
    pagination_class = DefaultPagination
    permission_classes = (HasUserListPermissions,)
    http_method_names = VALID_HTTP_METHODS

    def get_queryset(self):
        """Return a queryset for this user"""
        return (
            UserList.objects.all()
            .prefetch_related("author", "topics")
            .annotate(item_count=Count("children"))
        )

    def list(self, request, **kwargs):  # noqa: A003,ARG002
        queryset = self.get_queryset().filter(author_id=self.request.user.id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None, **kwargs):  # noqa: ARG002
        queryset = self.get_queryset().filter(
            Q(author_id=self.request.user.id)
            | Q(privacy_level=PrivacyLevel.unlisted.value)
        )
        userlist = get_object_or_404(queryset, pk=pk)
        serializer = self.get_serializer(userlist)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        instance.delete()


@extend_schema_view(
    list=extend_schema(summary="User List Resources List"),
    retrieve=extend_schema(summary="User List Resources Retrieve"),
    create=extend_schema(summary="User List Resource Relationship Add"),
    destroy=extend_schema(summary="User List Resource Relationship Remove"),
    partial_update=extend_schema(summary="User List Resource Relationship Update"),
)
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
    http_method_names = VALID_HTTP_METHODS

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


@cache_page(60 * settings.RSS_FEED_CACHE_MINUTES)
def podcast_rss_feed(request):  # noqa: ARG001
    """
    View to display the combined podcast rss file
    """

    rss = generate_aggregate_podcast_rss()
    return HttpResponse(
        rss.prettify(), content_type="application/rss+xml; charset=utf-8"
    )


@method_decorator(blocked_ip_exempt, name="dispatch")
class WebhookOCWNextView(views.APIView):
    """
    Handle webhooks coming from the OCW Next bucket
    """

    permission_classes = ()
    authentication_classes = ()

    def handle_exception(self, exc):
        """
        Raise any exception with request info instead of returning response
        with error status/message
        """
        msg = (
            f"Error ({exc}). BODY: {self.request.body or ''}, META: {self.request.META}"
        )
        raise WebhookException(msg) from exc

    @extend_schema(exclude=True)
    def post(self, request):
        """Process webhook request"""
        content = rapidjson.loads(request.body.decode())

        if not compare_digest(content.get("webhook_key", ""), settings.OCW_WEBHOOK_KEY):
            msg = "Incorrect webhook key"
            raise WebhookException(msg)

        version = content.get("version")
        prefix = content.get("prefix")
        site_uid = content.get("site_uid")
        unpublished = content.get("unpublished", False)

        if version == "live":
            if prefix is not None:
                # Index the course
                get_ocw_courses.delay(url_paths=[prefix], force_overwrite=False)
            elif site_uid is not None and unpublished is True:
                # Remove the course from the search index
                run = LearningResourceRun.objects.filter(
                    run_id=site_uid,
                    learning_resource__platform__code=PlatformType.ocw.name,
                ).first()
                if run:
                    resource = run.learning_resource
                    resource.published = False
                    resource.save()
                    resource_unpublished_actions(resource)

        return Response({})


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve", parameters=[]),
)
class ContentTagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Course Features and Content Feature Types
    """

    queryset = LearningResourceContentTag.objects.all().order_by("id")
    serializer_class = LearningResourceContentTagSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)
    lookup_url_kwarg = "id"
    lookup_field = "id_iexact"


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve", parameters=[]),
)
class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    MIT academic departments
    """

    queryset = LearningResourceDepartment.objects.all().order_by("department_id")
    serializer_class = LearningResourceDepartmentSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)
    lookup_url_kwarg = "department_id"
    lookup_field = "department_id__iexact"


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
)
class PlatformViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Platforms on which learning resources are hosted
    """

    queryset = LearningResourcePlatform.objects.all().order_by("code")
    serializer_class = LearningResourcePlatformSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
)
class OfferedByViewSet(viewsets.ReadOnlyModelViewSet):
    """
    MIT organizations that offer learning resources
    """

    queryset = LearningResourceOfferor.objects.all().order_by("code")
    serializer_class = LearningResourceOfferorSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)
    lookup_field = "code"
