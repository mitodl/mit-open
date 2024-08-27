"""Views for learning_resources"""

import logging
from hmac import compare_digest
from random import shuffle

import rapidjson
from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Q, QuerySet
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import views, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework_nested.viewsets import NestedViewSetMixin

from authentication.decorators import blocked_ip_exempt
from channels.constants import ChannelType
from channels.models import Channel
from learning_resources import permissions
from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
    PlatformType,
    PrivacyLevel,
)
from learning_resources.etl.podcast import generate_aggregate_podcast_rss
from learning_resources.exceptions import WebhookException
from learning_resources.filters import (
    ContentFileFilter,
    LearningResourceFilter,
    TopicFilter,
)
from learning_resources.models import (
    ContentFile,
    LearningResource,
    LearningResourceContentTag,
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourcePlatform,
    LearningResourceRelationship,
    LearningResourceRun,
    LearningResourceSchool,
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
    LearningResourceContentTagSerializer,
    LearningResourceDepartmentSerializer,
    LearningResourceOfferorDetailSerializer,
    LearningResourcePlatformSerializer,
    LearningResourceRelationshipSerializer,
    LearningResourceSchoolSerializer,
    LearningResourceSerializer,
    LearningResourceTopicSerializer,
    PodcastEpisodeResourceSerializer,
    PodcastResourceSerializer,
    ProgramResourceSerializer,
    UserListRelationshipSerializer,
    UserListSerializer,
    VideoPlaylistResourceSerializer,
    VideoResourceSerializer,
)
from learning_resources.tasks import get_ocw_courses
from learning_resources.utils import (
    resource_delete_actions,
    resource_unpublished_actions,
)
from main.constants import VALID_HTTP_METHODS
from main.filters import MultipleOptionsFilterBackend
from main.permissions import (
    AnonymousAccessReadonlyPermission,
    is_admin_user,
)
from main.utils import chunks

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
    filter_backends = [MultipleOptionsFilterBackend]
    filterset_class = LearningResourceFilter
    lookup_field = "id"

    def _get_base_queryset(self, resource_type: str | None = None) -> QuerySet:
        """
        Return learning resources based on query parameters

        Args:
            resource_type (str): Resource type to filter by (default is None)

        Returns:
            QuerySet of LearningResource objects matching the query parameters
        """
        # Valid fields to filter by, just resource_type for now
        user = self.request.user if hasattr(self, "request") else None
        lr_query = LearningResource.objects.for_serialization(user=user)
        if resource_type:
            lr_query = lr_query.filter(resource_type=resource_type)
        return lr_query.distinct()

    def get_queryset(self) -> QuerySet:
        """
        Generate a QuerySet for fetching valid learning resources

        Returns:
            QuerySet of LearningResource objects
        """
        return self._get_base_queryset().filter(published=True)


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of learning resources.",
    ),
    retrieve=extend_schema(
        description="Retrieve a single learning resource.",
    ),
)
class LearningResourceViewSet(
    BaseLearningResourceViewSet,
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
    BaseLearningResourceViewSet,
):
    """
    Viewset for Courses
    """

    lookup_url_kwarg = "id"
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
    BaseLearningResourceViewSet,
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
    lookup_url_kwarg = "id"

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
        resource_delete_actions(instance)


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
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="learning_resource_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="id of the parent learning resource",
        )
    ]
)
class ResourceListItemsViewSet(NestedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """
    Viewset for nested learning resources.

    """

    parent_lookup_kwargs = {"learning_resource_id": "parent_id"}
    permission_classes = (AnonymousAccessReadonlyPermission,)
    serializer_class = LearningResourceRelationshipSerializer
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
    set_user_list_relationships=extend_schema(
        summary="Set List Relationships",
        description="Set List Relationships on a given Learning Resource.",
    ),
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="id of the learning resource",
        ),
        OpenApiParameter(
            name="userlist_id",
            type=OpenApiTypes.INT,
            many=True,
            location=OpenApiParameter.QUERY,
            description="id of the parent user list",
        ),
        OpenApiParameter(
            name="learning_path_id",
            type=OpenApiTypes.INT,
            many=True,
            location=OpenApiParameter.QUERY,
            description="id of the parent learning path",
        ),
    ]
)
class LearningResourceListRelationshipViewSet(viewsets.GenericViewSet):
    """
    Viewset for managing relationships between Learning Resources
    and User Lists / Learning Paths
    """

    permission_classes = (AnonymousAccessReadonlyPermission,)
    filter_backends = [MultipleOptionsFilterBackend]
    serializer_class = LearningResourceRelationshipSerializer
    queryset = LearningResourceRelationship.objects.select_related("parent", "child")
    http_method_names = ["patch"]

    @action(detail=True, methods=["patch"], name="Set User List Relationships")
    def userlists(self, request, *args, **kwargs):  # noqa: ARG002
        """
        Set User List relationships for a given Learning Resource
        """
        learning_resource_id = kwargs.get("pk")
        user_list_ids = request.query_params.getlist("userlist_id")
        current_relationships = UserListRelationship.objects.filter(
            parent__author=request.user, child_id=learning_resource_id
        )
        current_relationships.exclude(parent_id__in=user_list_ids).delete()
        for userlist_id in user_list_ids:
            last_index = 0
            for index, relationship in enumerate(
                UserListRelationship.objects.filter(
                    parent__author=request.user, parent__id=userlist_id
                ).order_by("position")
            ):
                relationship.position = index
                relationship.save()
                last_index = index
            UserListRelationship.objects.create(
                parent_id=userlist_id,
                child_id=learning_resource_id,
                position=last_index + 1,
            )
        serializer = self.get_serializer(current_relationships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], name="Set Learning Path Relationships")
    def learning_paths(self, request, *args, **kwargs):  # noqa: ARG002
        """
        Set Learning Path relationships for a given Learning Resource
        """
        if not is_learning_path_editor(request):
            return Response(
                {"error": "You do not have permission to edit learning paths"},
                status=403,
            )
        learning_resource_id = kwargs.get("pk")
        learning_path_ids = request.query_params.getlist("learning_path_id")
        current_relationships = LearningResourceRelationship.objects.filter(
            child_id=learning_resource_id
        )
        current_relationships.exclude(parent_id__in=learning_path_ids).delete()
        for learning_path_id in learning_path_ids:
            last_index = 0
            for index, relationship in enumerate(
                LearningResourceRelationship.objects.filter(
                    parent__id=learning_path_id
                ).order_by("position")
            ):
                relationship.position = index
                relationship.save()
                last_index = index
            LearningResourceRelationship.objects.create(
                parent_id=learning_path_id,
                child_id=learning_resource_id,
                relation_type=LearningResourceRelationTypes.LEARNING_PATH_ITEMS,
                position=last_index + 1,
            )
        serializer = self.get_serializer(current_relationships, many=True)
        return Response(serializer.data)


@extend_schema_view(
    create=extend_schema(summary="Learning Path Resource Relationship Add"),
    destroy=extend_schema(summary="Learning Path Resource Relationship Remove"),
    partial_update=extend_schema(summary="Learning Path Resource Relationship Update"),
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="learning_resource_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="The learning resource id of the learning path",
        )
    ]
)
class LearningPathItemsViewSet(ResourceListItemsViewSet, viewsets.ModelViewSet):
    """
    Viewset for LearningPath related resources
    """

    serializer_class = LearningPathRelationshipSerializer
    permission_classes = (permissions.HasLearningPathItemPermissions,)
    http_method_names = VALID_HTTP_METHODS

    def create(self, request, *args, **kwargs):
        request.data["parent"] = request.data.get("parent_id")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        request.data["parent"] = request.data.get("parent_id")
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

    queryset = LearningResourceTopic.objects.for_serialization().order_by("name")
    serializer_class = LearningResourceTopicSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)
    filter_backends = [DjangoFilterBackend]
    filterset_class = TopicFilter


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="learning_resource_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="id of the parent learning resource",
        )
    ]
)
class ContentFileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for ContentFiles
    """

    serializer_class = ContentFileSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)
    queryset = (
        ContentFile.objects.for_serialization()
        .filter(published=True)
        .order_by("-created_on")
    )
    pagination_class = DefaultPagination
    filter_backends = [MultipleOptionsFilterBackend]
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

    parent_lookup_kwargs = {"learning_resource_id": "run__learning_resource"}


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
    create=extend_schema(summary="Create"),
    destroy=extend_schema(summary="Destroy"),
    partial_update=extend_schema(summary="Update"),
)
class UserListViewSet(viewsets.ModelViewSet):
    """
    Viewset for UserLists
    """

    serializer_class = UserListSerializer
    pagination_class = DefaultPagination
    permission_classes = (HasUserListPermissions,)
    http_method_names = VALID_HTTP_METHODS
    lookup_url_kwarg = "id"

    def get_queryset(self):
        """Return a queryset for this user"""
        return (
            UserList.objects.all()
            .prefetch_related("author", "topics")
            .annotate(item_count=Count("children"))
        )

    def list(self, request, **kwargs):  # noqa: ARG002
        queryset = self.get_queryset().filter(author_id=self.request.user.id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, id=None, **kwargs):  # noqa: A002,ARG002
        queryset = self.get_queryset().filter(
            Q(author_id=self.request.user.id)
            | Q(privacy_level=PrivacyLevel.unlisted.value)
        )
        userlist = get_object_or_404(queryset, pk=id)
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
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="userlist_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description="id of the parent user list",
        )
    ]
)
class UserListItemViewSet(NestedViewSetMixin, viewsets.ModelViewSet):
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
    parent_lookup_kwargs = {"userlist_id": "parent"}

    def create(self, request, *args, **kwargs):
        user_list_id = kwargs.get("userlist_id")
        request.data["parent"] = user_list_id

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        user_list_id = kwargs.get("userlist_id")
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
class WebhookOCWView(views.APIView):
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
        prefixes = content.get("prefixes", [prefix] if prefix else None)
        site_uid = content.get("site_uid")
        unpublished = content.get("unpublished", False)
        status = 200

        if version == "live":
            if prefixes is not None:
                # Index the course(s)
                prefixes = (
                    prefixes
                    if isinstance(prefixes, list)
                    else [prefix.strip() for prefix in prefixes.split(",")]
                )
                for url_paths in chunks(
                    prefixes, chunk_size=settings.OCW_ITERATOR_CHUNK_SIZE
                ):
                    get_ocw_courses.delay(
                        url_paths=url_paths,
                        force_overwrite=False,
                    )
                message = f"OCW courses queued for indexing: {prefixes}"
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
                    message = f"OCW course {site_uid} queued for unpublishing"
                else:
                    message = (
                        f"OCW course {site_uid} not found, so nothing to unpublish"
                    )
            else:
                message = (
                    f"Could not determine appropriate action from request: {content}"
                )
                status = 400

        else:
            message = "Not a live version, ignoring"
        return Response(data={"message": message}, status=status)


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


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve", parameters=[]),
)
class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    MIT academic departments
    """

    queryset = LearningResourceDepartment.objects.for_serialization(
        prefetch_school=True
    ).order_by("department_id")
    serializer_class = LearningResourceDepartmentSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)
    lookup_url_kwarg = "department_id"
    lookup_field = "department_id__iexact"


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve", parameters=[]),
)
class SchoolViewSet(viewsets.ReadOnlyModelViewSet):
    """
    MIT schools
    """

    queryset = LearningResourceSchool.objects.for_serialization().order_by("id")
    serializer_class = LearningResourceSchoolSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)


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

    queryset = LearningResourceOfferor.objects.for_serialization().order_by("code")
    serializer_class = LearningResourceOfferorDetailSerializer
    pagination_class = LargePagination
    permission_classes = (AnonymousAccessReadonlyPermission,)
    lookup_field = "code"


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of videos",
    ),
    retrieve=extend_schema(
        description="Retrieve a single video",
    ),
)
class VideoViewSet(BaseLearningResourceViewSet):
    """
    Viewset for Videos
    """

    resource_type_name_plural = "Videos"

    serializer_class = VideoResourceSerializer

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Videos

        Returns:
            QuerySet of LearningResource objects that are Videos
        """
        return self._get_base_queryset(
            resource_type=LearningResourceType.video.name
        ).filter(published=True)


@extend_schema_view(
    list=extend_schema(
        description="Get a paginated list of video playlists",
    ),
    retrieve=extend_schema(
        description="Retrieve a single video playlist",
    ),
)
class VideoPlaylistViewSet(BaseLearningResourceViewSet):
    """
    Viewset for VideoPlaylists
    """

    resource_type_name_plural = "Video Playlists"

    serializer_class = VideoPlaylistResourceSerializer

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Video Playlists

        Returns:
            QuerySet of LearningResource objects that are Video Playlists
        """
        return self._get_base_queryset(
            resource_type=LearningResourceType.video_playlist.name
        ).filter(published=True)


@extend_schema_view(
    retrieve=extend_schema(
        description="Retrieve a single featured resource",
    ),
)
class FeaturedViewSet(
    BaseLearningResourceViewSet,
):
    """
    Viewset for Featured Resources
    """

    lookup_url_kwarg = "id"
    resource_type_name_plural = "Featured Resources"
    serializer_class = LearningResourceSerializer

    @staticmethod
    def _randomize_results(results):
        """Randomize the results within each position"""
        if len(results) > 0:
            results_by_position = {}
            randomized_results = []
            for result in results:
                results_by_position.setdefault(result.position, []).append(result)
            for position in sorted(results_by_position.keys()):
                shuffle(results_by_position[position])
                randomized_results.extend(results_by_position[position])
            return randomized_results
        return results

    def get_queryset(self) -> QuerySet:
        """
        Generate a QuerySet for fetching featured LearningResource objects

        Returns:
            QuerySet of LearningResource objects that are in
            featured learning paths from certain offerors
        """
        featured_list_ids = Channel.objects.filter(
            channel_type=ChannelType.unit.name
        ).values_list("featured_list", flat=True)

        return (
            self._get_base_queryset()
            .filter(parents__parent_id__in=featured_list_ids)
            .filter(published=True)
            .annotate(position=F("parents__position"))
            .order_by("position")
            .distinct()
        )

    @extend_schema(
        summary="List",
        description="Get a paginated list of featured resources",
    )
    def list(self, request, *args, **kwargs):  # noqa: ARG002
        """Get a paginated list of featured resources"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(self._randomize_results(page), many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(self._randomize_results(queryset), many=True)
        return Response(serializer.data)
