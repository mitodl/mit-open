"""
URL Configuration for schema & documentation views
"""

from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path(
        "api/v0/schema/", SpectacularAPIView.as_view(api_version="v0"), name="v0_schema"
    ),
    path(
        "api/v0/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="v0_schema"),
        name="v0_swagger_ui",
    ),
    path(
        "api/v0/schema/redoc/",
        SpectacularRedocView.as_view(url_name="v0_schema"),
        name="v0_redoc",
    ),
    path(
        "api/v1/schema/", SpectacularAPIView.as_view(api_version="v1"), name="v1_schema"
    ),
    path(
        "api/v1/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="v1_schema"),
        name="v1_swagger_ui",
    ),
    path(
        "api/v1/schema/redoc/",
        SpectacularRedocView.as_view(url_name="v1_schema"),
        name="v1_redoc",
    ),
]
