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
    def resource_unpublished(self, resource):
        """
        Perform functions on a learning resource that has been unpublished

        Args:
            resource(LearningResource): The Learning Resource that was removed
        """
        if resource.resource_type == COURSE_TYPE:
            search_index_helpers.deindex_course(resource)
        elif resource.resource_type == PROGRAM_TYPE:
            search_index_helpers.deindex_program(resource)
        # Add other resource types here when supported by the search index

    @hookimpl
    def resource_delete(self, resource):
        """
        Remove a resource from the search index and then delete the object
        """
        self.resource_unpublished(resource)
        resource.delete()

    @hookimpl
    def resource_run_upserted(self, run):
        """
        Perform functions on an upserted learning resource run

        Args:
            run(LearningResourceRun): The LearningResourceRun that was upserted
        """
        search_index_helpers.index_run_content_files(run.id)

    @hookimpl
    def resource_run_unpublished(self, run):
        """
        Perform functions on a learning resource run that has been unpublished

        Args:
            run(LearningResourceRun): The Learning Resource run that was removed
        """
        search_index_helpers.deindex_run_content_files(run.id, unpublished_only=False)

    @hookimpl
    def resource_run_delete(self, run):
        """
        Remove a learning resource run's content files from the search index
        and then delete the object
        """
        self.resource_run_unpublished(run)
        run.delete()
