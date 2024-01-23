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
        "api/v0/schema/", SpectacularAPIView.as_view(api_version="v0"), name="schema_v0"
    ),
    path(
        "api/v0/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema_v0"),
        name="swagger-ui",
    ),
    path(
        "api/v0/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema_v0"),
        name="redoc",
    ),
    path(
        "api/v1/schema/", SpectacularAPIView.as_view(api_version="v1"), name="schema_v1"
    ),
    path(
        "api/v1/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema_v1"),
        name="swagger-ui",
    ),
    path(
        "api/v1/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema_v1"),
        name="redoc",
    ),
]
