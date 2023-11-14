# Generated on 2023-11-13 15:06

from django.db import migrations

from learning_resources.etl.utils import update_course_numbers_json


def set_course_number_departments(apps, schema_editor):
    """
    Update course_number departments for every course
    """
    Course = apps.get_model("learning_resources", "Course")
    for course in Course.objects.select_related("learning_resource").iterator():
        update_course_numbers_json(course)


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0024_remove_course_extra_course_numbers"),
    ]

    operations = [
        migrations.RunPython(
            set_course_number_departments, reverse_code=migrations.RunPython.noop
        ),
    ]
