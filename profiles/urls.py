"""URL configurations for profiles"""

from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from profiles.views import (
    ProfileViewSet,
    UserViewSet,
    CurrentUserRetrieveViewSet,
    UserWebsiteViewSet,
    name_initials_avatar_view,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user_api")
router.register(r"profiles", ProfileViewSet, basename="profile_api")
router.register(r"websites", UserWebsiteViewSet, basename="user_websites_api")

urlpatterns = [
    re_path(
        r"^api/v0/users/me/?$",
        CurrentUserRetrieveViewSet.as_view(
            {"get": "retrieve"}
        ),
        name="users_api-me",
    ),
    re_path(r"^api/v0/", include(router.urls)),
    # The URL that gravatar will redirect to if no gravatar exists for the user (no query parameters allowed).  # noqa: E501
    re_path(
        r"^profile/(?P<username>[A-Za-z0-9_]+)/(?P<size>\d+)/(?P<color>[A-Za-z0-9]+)/(?P<bgcolor>[A-Za-z0-9]+).png",
        name_initials_avatar_view,
        name="name-initials-avatar",
    ),
]
