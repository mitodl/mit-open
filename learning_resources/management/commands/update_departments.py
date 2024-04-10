"""Management command for populating LearningResourceDepartment data"""

from django.core.management import BaseCommand
from django.db import transaction

from learning_resources.constants import DEPARTMENTS
from learning_resources.models import LearningResourceDepartment
from learning_resources.utils import department_upserted_actions
from main.utils import now_in_utc


class Command(BaseCommand):
    """Update LearningResourceDepartment data"""

    help = "Update LearningResourceDepartment data"

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceDepartment data"""

        self.stdout.write("Updating department data")
        start = now_in_utc()
        departments = []
        with transaction.atomic():
            for department_id, name in DEPARTMENTS.items():
                dept, _ = LearningResourceDepartment.objects.update_or_create(
                    department_id=department_id,
                    defaults={"name": name},
                )
                department_upserted_actions(dept)
                departments.append(department_id)
            LearningResourceDepartment.objects.exclude(
                department_id__in=departments
            ).delete()
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Update of departments finished, took {total_seconds} seconds"
        )
