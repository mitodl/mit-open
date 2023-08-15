"""Urls for channels_fields"""
from django.urls import include, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter

from learning_resources.views import (
    CourseViewSet,
    LearningResourceViewSet,
    ProgramViewSet,
)

router = DefaultRouter()
router.register(
    r"learning_resources", LearningResourceViewSet, basename="learning_resources_api"
)
router.register(r"courses", CourseViewSet, basename="lr_courses_api")
router.register(r"programs", ProgramViewSet, basename="lr_programs_api")


urlpatterns = [
    re_path(r"^api/v1/", include(router.urls)),
    re_path(r"api/v1/schema/$", SpectacularAPIView.as_view(), name="schema"),
    re_path(
        "api/v1/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    re_path(
        "api/v1/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
