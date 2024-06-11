"""Views for channels"""

import logging

from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.generics import ListCreateAPIView, get_object_or_404
from rest_framework.response import Response
from rest_framework.status import HTTP_204_NO_CONTENT
from rest_framework.views import APIView

from channels.api import get_group_role_name, remove_user_role
from channels.constants import FIELD_ROLE_MODERATORS
from channels.models import FieldChannel
from channels.permissions import FieldModeratorPermissions, HasFieldPermission
from channels.serializers import (
    FieldChannelCreateSerializer,
    FieldChannelSerializer,
    FieldChannelWriteSerializer,
    FieldModeratorSerializer,
)
from learning_resources.views import LargePagination
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


@extend_schema_responses(FieldChannelSerializer)
@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
    create=extend_schema(summary="Create"),
    destroy=extend_schema(summary="Destroy"),
    partial_update=extend_schema(summary="Update"),
)
class FieldChannelViewSet(
    viewsets.ModelViewSet,
):
    """
    CRUD Operations related to FieldChannels. Channels may represent groups
    or organizations at MIT and are a high-level categorization of content.
    """

    pagination_class = LargePagination
    permission_classes = (HasFieldPermission,)
    http_method_names = VALID_HTTP_METHODS
    lookup_field = "id"
    lookup_url_kwarg = "id"
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["channel_type"]

    def get_queryset(self):
        """Return a queryset"""
        return (
            FieldChannel.objects.prefetch_related(
                "lists", "subfields", "subfields__field_channel"
            )
            .select_related(
                "featured_list", "topic_detail", "department_detail", "unit_detail"
            )
            .all()
        )

    def get_serializer_class(self):
        if self.action in ("retrieve", "list"):
            return FieldChannelSerializer
        elif self.action == "create":
            return FieldChannelCreateSerializer
        return FieldChannelWriteSerializer

    def perform_destroy(self, instance):
        """Remove the field channel"""
        instance.delete()
        return Response(status=HTTP_204_NO_CONTENT)


@extend_schema_view(
    retrieve=extend_schema(
        summary="FieldChannel Detail Lookup by channel type and name"
    ),
)
class ChannelByTypeNameDetailView(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    View for retrieving an individual field channel by type and name
    """

    serializer_class = FieldChannelSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)

    def get_object(self):
        """
        Return the field channel by type and name
        """
        return get_object_or_404(
            FieldChannel,
            channel_type=self.kwargs["channel_type"],
            name=self.kwargs["name"],
        )


@extend_schema_view(
    get=extend_schema(summary="Field Moderators List"),
    post=extend_schema(summary="Field Moderators Create"),
)
class FieldModeratorListView(ListCreateAPIView):
    """
    View for listing and adding moderators
    """

    permission_classes = (FieldModeratorPermissions,)
    serializer_class = FieldModeratorSerializer

    def get_queryset(self):
        """
        Build a queryset of relevant users with moderator permissions for this channel
        """
        field_group_name = get_group_role_name(
            self.kwargs["id"],
            FIELD_ROLE_MODERATORS,
        )

        return User.objects.filter(groups__name=field_group_name)


@extend_schema_view(
    delete=extend_schema(summary="Field Moderators Destroy"),
)
class FieldModeratorDetailView(APIView):
    """
    View to retrieve and remove field channel moderators
    """

    permission_classes = (FieldModeratorPermissions,)
    serializer_class = FieldModeratorSerializer

    def delete(self, request, *args, **kwargs):  # noqa: ARG002
        """Remove the user from the moderator groups for this website"""
        user = User.objects.get(username=self.kwargs["moderator_name"])
        remove_user_role(
            FieldChannel.objects.get(id=self.kwargs["id"]), FIELD_ROLE_MODERATORS, user
        )
        return Response(status=HTTP_204_NO_CONTENT)
