"""Management command for updating course.course_numbers JSON"""

from django.core.management import BaseCommand

from learning_resources.etl.utils import update_course_numbers_json
from learning_resources.models import Course
from main.utils import now_in_utc


class Command(BaseCommand):
    """Update course.course_numbers JSON"""

    help = "Update course.course_numbers JSON"

    def handle(self, *args, **options):  # noqa: ARG002
        """Update LearningResourceDepartment data"""

        self.stdout.write("Updating course.course_numbers JSON data for courses")
        start = now_in_utc()
        for course in Course.objects.select_related("learning_resource").iterator():
            update_course_numbers_json(course)
        total_seconds = (now_in_utc() - start).total_seconds()
        self.stdout.write(
            f"Update of course.course_numbers finished, took {total_seconds} seconds"
        )
