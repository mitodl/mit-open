"""URL configurations for profiles"""

from django.urls import include, re_path, path
from rest_framework.routers import DefaultRouter

from profiles.views import (
    CurrentUserRetrieveViewSet,
    ProfileViewSet,
    UserViewSet,
    UserWebsiteViewSet,
    name_initials_avatar_view,
    ProgramLetterInterceptView,
    ProgramLetterDisplayView,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user_api")
router.register(r"profiles", ProfileViewSet, basename="profile_api")
router.register(r"websites", UserWebsiteViewSet, basename="user_websites_api")

v0_urls = [
    re_path(
        r"^users/me/$",
        CurrentUserRetrieveViewSet.as_view({"get": "retrieve"}),
        name="users_api-me",
    ),
    re_path(r"", include(router.urls)),
]

app_name = "profile"
urlpatterns = [
    re_path("api/v0/", include((v0_urls, "v0"))),
    # The URL that gravatar will redirect to if no gravatar exists for the user (no query parameters allowed).  # noqa: E501
    re_path(
        r"^profile/(?P<username>[A-Za-z0-9_]+)/(?P<size>\d+)/(?P<color>[A-Za-z0-9]+)/(?P<bgcolor>[A-Za-z0-9]+).png",
        name_initials_avatar_view,
        name="name-initials-avatar",
    ),
    path(
        "program_letter/intercept/<int:program_id>/",
        ProgramLetterInterceptView.as_view(),
        name="program-letter-intercept",
    ),
    re_path(
        r"^program_letter/view/(?P<uuid>[0-9a-f\-]{32,})/$",
        ProgramLetterDisplayView.as_view(),
        name="program-letter-view",
    ),
]
