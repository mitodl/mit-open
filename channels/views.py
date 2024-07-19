"""Views for channels"""

import logging

from django.contrib.auth.models import User
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.generics import ListCreateAPIView, get_object_or_404
from rest_framework.response import Response
from rest_framework.status import HTTP_204_NO_CONTENT
from rest_framework.views import APIView

from channels.api import get_group_role_name, remove_user_role
from channels.constants import CHANNEL_ROLE_MODERATORS
from channels.models import Channel, ChannelGroupRole, ChannelList
from channels.permissions import ChannelModeratorPermissions, HasChannelPermission
from channels.serializers import (
    ChannelCreateSerializer,
    ChannelModeratorSerializer,
    ChannelSerializer,
    ChannelWriteSerializer,
)
from learning_resources.views import DefaultPagination
from main.constants import VALID_HTTP_METHODS
from main.permissions import AnonymousAccessReadonlyPermission

log = logging.getLogger(__name__)


def extend_schema_responses(serializer):
    """
    Specify a serializer for all view **responses** when generating OpenAPI schema
    via drf-spectacular. The request schema will be inferred as usual.
    """

    def decorate(view):
        extend_schema_view(
            list=extend_schema(responses={200: serializer}),
            retrieve=extend_schema(responses={200: serializer}),
            create=extend_schema(responses={201: serializer}),
            update=extend_schema(responses={200: serializer}),
            partial_update=extend_schema(responses={200: serializer}),
        )(view)
        return view

    return decorate


@extend_schema_responses(ChannelSerializer)
@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
    create=extend_schema(summary="Create"),
    destroy=extend_schema(summary="Destroy"),
    partial_update=extend_schema(summary="Update"),
)
class ChannelViewSet(
    viewsets.ModelViewSet,
):
    """
    CRUD Operations related to Channels. Channels may represent groups
    or organizations at MIT and are a high-level categorization of content.
    """

    pagination_class = DefaultPagination
    permission_classes = (HasChannelPermission,)
    http_method_names = VALID_HTTP_METHODS
    lookup_field = "id"
    lookup_url_kwarg = "id"
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["channel_type"]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        """Return the context data"""
        moderated_channel_ids = []
        if self.request.user and self.request.user.is_authenticated:
            moderated_channel_ids = (
                ChannelGroupRole.objects.select_related("group")
                .filter(role=CHANNEL_ROLE_MODERATORS, group__user=self.request.user)
                .values_list("channel_id", flat=True)
            )
        context["moderated_channel_ids"] = moderated_channel_ids
        return context

    def get_queryset(self):
        """Return a queryset"""
        return (
            Channel.objects.prefetch_related(
                Prefetch(
                    "lists",
                    queryset=ChannelList.objects.prefetch_related(
                        "channel_list", "channel__lists", "channel__featured_list"
                    ).order_by("position"),
                ),
                "sub_channels",
                Prefetch(
                    "sub_channels__channel",
                    queryset=Channel.objects.annotate_channel_url(),
                ),
            )
            .annotate_channel_url()
            .select_related(
                "featured_list",
                "topic_detail",
                "department_detail",
                "unit_detail",
                "pathway_detail",
            )
            .all()
        )

    def get_serializer_class(self):
        if self.action in ("retrieve", "list"):
            return ChannelSerializer
        elif self.action == "create":
            return ChannelCreateSerializer
        return ChannelWriteSerializer

    def perform_destroy(self, instance):
        """Remove the channel"""
        instance.delete()
        return Response(status=HTTP_204_NO_CONTENT)


@extend_schema_view(
    retrieve=extend_schema(summary="Channel Detail Lookup by channel type and name"),
)
class ChannelByTypeNameDetailView(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    View for retrieving an individual channel by type and name
    """

    serializer_class = ChannelSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)

    def get_object(self):
        """
        Return the channel by type and name
        """
        return get_object_or_404(
            Channel,
            channel_type=self.kwargs["channel_type"],
            name=self.kwargs["name"],
        )


@extend_schema_view(
    get=extend_schema(summary="Channel Moderators List"),
    post=extend_schema(summary="Channel Moderators Create"),
)
class ChannelModeratorListView(ListCreateAPIView):
    """
    View for listing and adding moderators
    """

    permission_classes = (ChannelModeratorPermissions,)
    serializer_class = ChannelModeratorSerializer

    def get_queryset(self):
        """
        Build a queryset of relevant users with moderator permissions for this channel
        """
        channel_group_name = get_group_role_name(
            self.kwargs["id"],
            CHANNEL_ROLE_MODERATORS,
        )

        return User.objects.filter(groups__name=channel_group_name)


@extend_schema_view(
    delete=extend_schema(summary="Channel Moderators Destroy"),
)
class ChannelModeratorDetailView(APIView):
    """
    View to retrieve and remove channel moderators
    """

    permission_classes = (ChannelModeratorPermissions,)
    serializer_class = ChannelModeratorSerializer

    def delete(self, request, *args, **kwargs):  # noqa: ARG002
        """Remove the user from the moderator groups for this website"""
        user = User.objects.get(username=self.kwargs["moderator_name"])
        remove_user_role(
            Channel.objects.get(id=self.kwargs["id"]), CHANNEL_ROLE_MODERATORS, user
        )
        return Response(status=HTTP_204_NO_CONTENT)
