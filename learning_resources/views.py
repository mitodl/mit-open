"""Views for learning_resources"""
from django.db.models import Prefetch, Q
from rest_framework import viewsets

from learning_resources.constants import LearningResourceType
from learning_resources.models import LearningResource, LearningResourceRun
from learning_resources.serializers import LearningResourceSerializer
from open_discussions.permissions import AnonymousAccessReadonlyPermission


class LearningResourceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for LearningResources
    """

    serializer_class = LearningResourceSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)

    def _get_base_queryset(
        self, resource_type: str = None, lr_filters=None, type_filters=None
    ):
        """Return learning resources based on query parameters"""
        lr_query = LearningResource.objects.filter(
            published=True,
        )
        if resource_type:
            lr_query = lr_query.filter(resource_type=resource_type)
        if lr_filters:
            lr_query = lr_query.filter(
                Q(**lr_filters),
            )
        if resource_type and type_filters:
            lr_query = lr_query.filter(
                Q(
                    {
                        f"{resource_type}__{item}": type_filters[item]
                        for item in type_filters
                    }
                )
            )
        prefetches = [
            "topics",
            "offered_by",
            "image",
            "platform",
            *([item.value for item in LearningResourceType]),
        ]
        if not resource_type or resource_type in (
            LearningResourceType.program.value,
            LearningResourceType.course.value,
        ):
            prefetches.append(
                Prefetch(
                    "runs",
                    queryset=LearningResourceRun.objects.filter(
                        published=True
                    ).order_by("-start_date"),
                ),
            )
        lr_query = lr_query.prefetch_related(*prefetches).distinct()
        return lr_query

    def get_queryset(self):
        """Generate a QuerySet for fetching valid learning resources"""
        return self._get_base_queryset()


class CourseViewSet(LearningResourceViewSet):
    """
    Viewset for Courses
    """

    def get_queryset(self):
        """Generate a QuerySet for fetching valid courses"""
        return self._get_base_queryset(resource_type=LearningResourceType.course.value)


class ProgramViewSet(LearningResourceViewSet):
    """
    Viewset for Programs
    """

    def get_queryset(self):
        """Generate a QuerySet for fetching valid courses"""
        return self._get_base_queryset(resource_type=LearningResourceType.program.value)
