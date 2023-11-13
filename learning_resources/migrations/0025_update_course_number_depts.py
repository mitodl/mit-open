# Generated on 2023-11-13 15:06

from django.db import migrations

from learning_resources.etl.constants import CourseNumberType, ETLSource
from learning_resources.etl.utils import generate_course_numbers_json


def set_course_number_departments(apps, schema_editor):
    """
    Update course_number departments for every course
    """
    Course = apps.get_model("learning_resources", "Course")
    for course in Course.objects.select_related("learning_resource").iterator():
        is_ocw = course.learning_resource.etl_source == ETLSource.ocw.name
        extra_nums = [
            num["value"]
            for num in course.course_numbers
            if num["listing_type"] == CourseNumberType.cross_listed.value
        ]
        course.course_numbers = generate_course_numbers_json(
            (
                course.learning_resource.readable_id.split("+")[0]
                if is_ocw
                else course.learning_resource.readable_id
            ),
            extra_nums=extra_nums,
            is_ocw=is_ocw,
        )
        course.save()


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0024_remove_course_extra_course_numbers"),
    ]

    operations = [
        migrations.RunPython(
            set_course_number_departments, reverse_code=migrations.RunPython.noop
        ),
    ]
