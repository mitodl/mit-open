"""Pluggy plugins for learning_resources_search"""
from django.apps import apps

from learning_resources_search import search_index_helpers
from learning_resources_search.constants import COURSE_TYPE, PROGRAM_TYPE


class SearchIndexPlugin:
    """Perform search index updates on learning resources"""

    hookimpl = apps.get_app_config("learning_resources").hookimpl

    @hookimpl
    def resource_upserted(self, resource):
        """
        Perform functions on an upserted learning resource

        Args:
            resource(LearningResource): The Learning Resource that was upserted
        """
        if resource.resource_type == COURSE_TYPE:
            search_index_helpers.upsert_course(resource.id)
        elif resource.resource_type == PROGRAM_TYPE:
            search_index_helpers.upsert_program(resource.id)
        # Add more resource types here when supported by the search index

    @hookimpl
    def resource_removed(self, resource):
        """
        Perform functions on a learning resource that has been removed/unpublished

        Args:
            resource(LearningResource): The Learning Resource that was upserted
        """
        if resource.resource_type == COURSE_TYPE:
            search_index_helpers.deindex_course(resource)
        elif resource.resource_type == PROGRAM_TYPE:
            search_index_helpers.deindex_program(resource)
        # Add more resource types here when supported by the search index
