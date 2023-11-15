"""Pluggy plugins for learning_resources_search"""
import logging

from django.apps import apps

from learning_resources_search import tasks
from learning_resources_search.constants import (
    COURSE_TYPE,
)

log = logging.getLogger()


def try_with_retry_as_task(function, *args):
    """
    Try running the task, if it errors, run it as a celery task.
    """
    try:
        function(*args)
    except Exception:  # noqa: BLE001
        function.delay(*args)


class SearchIndexPlugin:
    """Perform search index updates on learning resources"""

    hookimpl = apps.get_app_config("learning_resources").hookimpl

    @hookimpl
    def resource_upserted(self, resource):
        """
        Upsert a created/modified resource to the search index

        Args:
            resource(LearningResource): The Learning Resource that was upserted
        """
        try_with_retry_as_task(tasks.upsert_learning_resource, resource.id)

    @hookimpl
    def resource_unpublished(self, resource):
        """
        Remove an unpublished resource from the search index

        Args:
            resource(LearningResource): The Learning Resource that was removed
        """
        try_with_retry_as_task(
            tasks.deindex_document,
            resource.id,
            resource.resource_type,
        )

        if resource.resource_type == COURSE_TYPE:
            for run in resource.runs.all():
                self.resource_run_unpublished(run)

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
        Upsert an created/modified run's content files

         Args:
             run(LearningResourceRun): The LearningResourceRun that was upserted
        """
        try_with_retry_as_task(tasks.index_run_content_files, run.id)

    @hookimpl
    def resource_run_unpublished(self, run):
        """
        Remove a learning resource run's content files from the search index

        Args:
            run(LearningResourceRun): The Learning Resource run that was removed
        """
        try_with_retry_as_task(tasks.deindex_run_content_files, run.id, False)  # noqa: FBT003

    @hookimpl
    def resource_run_delete(self, run):
        """
        Remove a learning resource run's content files from the search index
        and then delete the object
        """
        self.resource_run_unpublished(run)
        run.delete()
