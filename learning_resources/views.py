"""Views for learning_resources"""
import logging
from typing import Dict

from django.db.models import Q, QuerySet
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination

from learning_resources.constants import LearningResourceType
from learning_resources.models import LearningResource
from learning_resources.serializers import LearningResourceSerializer
from open_discussions.permissions import AnonymousAccessReadonlyPermission

log = logging.getLogger(__name__)


class DefaultPagination(LimitOffsetPagination):
    """
    Pagination class for course_catalog viewsets which gets default_limit and max_limit from settings
    """

    default_limit = 10
    max_limit = 100


class LearningResourceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Viewset for LearningResources
    """

    serializer_class = LearningResourceSerializer
    permission_classes = (AnonymousAccessReadonlyPermission,)
    pagination_class = DefaultPagination

    # Shortcuts for querying certain nested fields
    lr_attributes = {
        "start_date": "runs__start_date",
        "enrollment_start_date": "runs__enrollment_start_date",
        "level": "runs__level",
        "availability": "runs__availability",
        "topics": "topics__name",
        "department": "department__name",
        "platform": "platform__platform",
        "run_id": "runs__run_id",
    }

    def _convert_query_params_to_filters(self) -> Dict:
        """
        Convert query parameters to appropriate model filters

        Returns:
            Dict of model filters for a query
        """
        filters = {}
        for query_param in self.request.query_params:
            filter_key = query_param
            for attribute, replacement in self.lr_attributes.items():
                if query_param.startswith(attribute):
                    filter_key = query_param.replace(attribute, replacement)
            filters[filter_key] = self.request.query_params[query_param]
        return filters

    def _get_base_queryset(self, resource_type: str = None) -> QuerySet:
        """
        Return learning resources based on query parameters

        Args:
            resource_type (str): Resource type to filter by (default is None)

        Returns:
            QuerySet of LearningResource objects matching the query parameters
        """
        lr_query = LearningResource.objects.filter(
            published=True,
        )
        if resource_type:
            lr_query = lr_query.filter(resource_type=resource_type)
        if self.request.query_params:
            lr_query = lr_query.filter(
                Q(**self._convert_query_params_to_filters()),
            )
        prefetches = [
            "topics",
            "offered_by",
            "resource_content_tags",
            "runs",
            "runs__instructors",
            "runs__image",
        ]
        if resource_type == LearningResourceType.program.value:
            prefetches.extend(
                [
                    "program__courses__topics",
                    "program__courses__image",
                    "program__courses__offered_by",
                    "program__courses__resource_content_tags",
                ]
            )

        lr_query = lr_query.select_related(
            "image",
            "department",
            *([item.value for item in LearningResourceType]),
        )
        lr_query = lr_query.prefetch_related(*prefetches).distinct()
        return lr_query

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid learning resources

        Returns:
            QuerySet of LearningResource objects
        """
        return self._get_base_queryset()

    @action(methods=["GET"], detail=False)
    def new(self, request):
        """
        Get new resources
        """
        page = self.paginate_queryset(self.get_queryset().order_by("-created_on"))
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class CourseViewSet(LearningResourceViewSet):
    """
    Viewset for Courses
    """

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Course objects

        Returns:
            QuerySet of LearningResource objects that are Courses
        """
        return self._get_base_queryset(resource_type=LearningResourceType.course.value)


class ProgramViewSet(LearningResourceViewSet):
    """
    Viewset for Programs
    """

    def get_queryset(self):
        """
        Generate a QuerySet for fetching valid Programs

        Returns:
            QuerySet of LearningResource objects that are Programs
        """
        return self._get_base_queryset(resource_type=LearningResourceType.program.value)
