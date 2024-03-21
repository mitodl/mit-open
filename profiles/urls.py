"""URL configurations for profiles"""

from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from profiles.views import (
    CurrentUserRetrieveViewSet,
    ExperimentalCurrentUserRetrieveViewSet,
    ProfileViewSet,
    ProgramLetterInterceptView,
    UserProgramCertificateViewSet,
    UserViewSet,
    UserWebsiteViewSet,
    name_initials_avatar_view,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user_api")
router.register(r"profiles", ProfileViewSet, basename="profile_api")
router.register(r"websites", UserWebsiteViewSet, basename="user_websites_api")
router.register(
    r"program_certificates",
    UserProgramCertificateViewSet,
    basename="user_program_certificates_api",
)


v0_urls = [
    re_path(
        r"^users/me/$",
        CurrentUserRetrieveViewSet.as_view({"get": "retrieve"}),
        name="users_api-me",
    ),
    re_path(r"", include(router.urls)),
]


v1_urls = [
    re_path(
        r"^users/me/$",
        ExperimentalCurrentUserRetrieveViewSet.as_view({"get": "retrieve"}),
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
    re_path("api/v1/", include((v1_urls, "v1"))),
    path(
        "program_letter/<int:program_id>/",
        ProgramLetterInterceptView.as_view(),
        name="program-letter-intercept",
    ),
]
