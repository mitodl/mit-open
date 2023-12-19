"""Views for channels"""

import logging

from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.generics import ListCreateAPIView
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
from open_discussions.constants import VALID_HTTP_METHODS

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
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    CRUD Operations related to Fields. Fields may represent groups or organizations
    at MIT and are a high-level categorization of content.
    """

    pagination_class = LargePagination
    permission_classes = (HasFieldPermission,)
    http_method_names = VALID_HTTP_METHODS
    lookup_field = "name"
    lookup_url_kwarg = "field_name"

    def get_queryset(self):
        """Return a queryset"""
        return FieldChannel.objects.all().prefetch_related(
            "subfields", "subfields__field_channel"
        )

    def get_serializer_class(self):
        if self.action in ("retrieve", "list"):
            return FieldChannelSerializer
        elif self.action == "create":
            return FieldChannelCreateSerializer
        return FieldChannelWriteSerializer

    def delete(self, request, *args, **kwargs):  # noqa: ARG002
        """Remove the user from the moderator groups for this field channel"""
        FieldChannel.objects.get_object_or_404(name=kwargs["field_name"]).delete()
        return Response(status=HTTP_204_NO_CONTENT)


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
        Builds a queryset of relevant users with moderator permissions for this field channel
        """  # noqa: D401, E501
        field_group_name = get_group_role_name(
            self.kwargs["field_name"],
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
        field_name = self.kwargs["field_name"]
        remove_user_role(
            FieldChannel.objects.get(name=field_name), FIELD_ROLE_MODERATORS, user
        )
        return Response(status=HTTP_204_NO_CONTENT)
