"""Urls for channels"""

from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from channels.views import (
    ChannelByTypeNameDetailView,
    ChannelViewSet,
    FieldModeratorDetailView,
    FieldModeratorListView,
)

v0_router = DefaultRouter()
v0_router.register(r"channels", ChannelViewSet, basename="field_channels_api")

v0_urls = [
    re_path(
        r"^channels/type/(?P<channel_type>[A-Za-z0-9_\-]+)/(?P<name>[A-Za-z0-9_\-]+)/$",
        ChannelByTypeNameDetailView.as_view({"get": "retrieve"}),
        name="field_by_type_name_api-detail",
    ),
    re_path(
        r"^channels/(?P<id>\d+)/moderators/$",
        FieldModeratorListView.as_view(),
        name="field_moderators_api-list",
    ),
    re_path(
        r"^channels/(?P<id>\d+)/moderators/(?P<moderator_name>[A-Za-z0-9_]+)/$",
        FieldModeratorDetailView.as_view(),
        name="field_moderators_api-detail",
    ),
    *v0_router.urls,
]

app_name = "channels"
urlpatterns = [
    re_path(r"^api/v0/", include((v0_urls, "v0"))),
]
