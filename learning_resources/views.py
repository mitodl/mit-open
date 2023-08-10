"""Views for learning_resources"""
from django.db.models import Prefetch
from rest_framework import viewsets

from learning_resources.constants import LearningResourceType
from learning_resources.models import LearningResource, LearningResourceRun
from learning_resources.serializers import LearningResourceSerializer
from open_discussions.permissions import AnonymousAccessReadonlyPermission


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for Courses
    """

    serializer_class = LearningResourceSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)

    def _get_base_queryset(self, *args, **kwargs):
        """Return the base queryset for all actions"""
        return (
            LearningResource.objects.filter(
                *args,
                **kwargs,
                published=True,
                resource_type=LearningResourceType.course.value,
                runs__published=True,
                runs__isnull=False,
            )
            .prefetch_related(
                "topics",
                "offered_by",
                "image",
                "platform",
                "course",
                Prefetch(
                    "runs",
                    queryset=LearningResourceRun.objects.filter(
                        published=True
                    ).order_by("-start_date"),
                ),
            )
            .distinct()
        )

    def get_queryset(self):
        """Generate a QuerySet for fetching valid courses"""
        return self._get_base_queryset()


class ProgramViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for Programs
    """

    serializer_class = LearningResourceSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)

    def _get_base_queryset(self, *args, **kwargs):
        """Return the base queryset for all actions"""
        return (
            LearningResource.objects.filter(
                *args,
                **kwargs,
                published=True,
                resource_type=LearningResourceType.program.value,
                runs__published=True,
                runs__isnull=False,
            )
            .prefetch_related(
                "topics",
                "offered_by",
                "image",
                "platform",
                "program",
                Prefetch(
                    "runs",
                    queryset=LearningResourceRun.objects.filter(
                        published=True
                    ).order_by("-start_date"),
                ),
            )
            .distinct()
        )

    def get_queryset(self):
        """Generate a QuerySet for fetching valid courses"""
        return self._get_base_queryset()


class LearningResourceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for LearningResources
    """

    serializer_class = LearningResourceSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)

    def _get_base_queryset(self, *args, **kwargs):
        """Return the base queryset for all actions"""
        return (
            LearningResource.objects.filter(
                *args,
                **kwargs,
                published=True,
                runs__published=True,
                runs__isnull=False,
            )
            .prefetch_related(
                "topics",
                "offered_by",
                "image",
                "platform",
                "course",
                "program",
                Prefetch(
                    "runs",
                    queryset=LearningResourceRun.objects.filter(
                        published=True
                    ).order_by("-start_date"),
                ),
            )
            .distinct()
        )

    def get_queryset(self):
        """Generate a QuerySet for fetching valid courses"""
        return self._get_base_queryset()
