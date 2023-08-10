"""Urls for channels_fields"""
from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from learning_resources.views import (
    LearningResourceViewSet,
    CourseViewSet,
    ProgramViewSet,
)

router = DefaultRouter()
router.register(
    r"learning_resources", LearningResourceViewSet, basename="learning_resources_api"
)
router.register(r"courses", CourseViewSet, basename="lr_courses_api")
router.register(r"programs", ProgramViewSet, basename="lr_programs_api")


urlpatterns = [re_path(r"^api/v1/", include(router.urls))]
