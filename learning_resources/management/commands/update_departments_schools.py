"""Management command for populating LearningResourceDepartment data"""

from django.core.management import BaseCommand

from data_fixtures.utils import (
    upsert_department_data,
    upsert_school_data,
)
from main.utils import clear_search_cache, now_in_utc


class Command(BaseCommand):
    """Update LearningResourceDepartment data"""

    help = "Update LearningResourceDepartment data"

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceDepartment data"""

        self.stdout.write("Updating department data")
        start = now_in_utc()
        schools = upsert_school_data()
        departments = upsert_department_data()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Update of {len(schools)} schools & {len(departments)} "
            f"departments finished, took {total_seconds} seconds"
        )
        clear_search_cache()
