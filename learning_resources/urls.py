"""Urls for channels_fields"""
from django.urls import include, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_extensions.routers import ExtendedSimpleRouter

from learning_resources import views

router = ExtendedSimpleRouter()
router.register(
    r"learning_resources",
    views.LearningResourceViewSet,
    basename="learning_resources_api",
).register(
    r"children",
    views.ResourceListItemsViewSet,
    basename="lr_learning_resource_items_api",
    parents_query_lookups=["parent_id"],
)
router.register(r"courses", views.CourseViewSet, basename="lr_courses_api")
router.register(r"programs", views.ProgramViewSet, basename="lr_programs_api").register(
    r"courses",
    views.ResourceListItemsViewSet,
    basename="lr_program_courses_api",
    parents_query_lookups=["parent_id"],
)
router.register(
    r"learningpaths", views.LearningPathViewSet, basename="lr_learningpaths_api"
).register(
    r"resources",
    views.LearningPathItemsViewSet,
    basename="lr_learningpathitems_api",
    parents_query_lookups=["parent_id"],
)

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
