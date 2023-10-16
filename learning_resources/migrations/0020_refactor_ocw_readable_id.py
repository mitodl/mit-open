# Generated manually to convert the readable_id for OCW learning resources

from django.db import migrations
from django.utils.text import slugify

from learning_resources.constants import PlatformType
from learning_resources.etl import ocw


def update_ocw_readable_id(apps, schema_editor):
    """
    Update readable_id and course.extra_course_numbers for existing
    OCW learning resources
    """
    LearningResource = apps.get_model("learning_resources", "LearningResource")
    for resource in LearningResource.objects.filter(
        platform__platform=PlatformType.ocw.value
    ).prefetch_related("runs"):
        resource.etl_source = ocw.ETL_SOURCE
        run = resource.runs.get(url=resource.url)
        resource.readable_id = (
            f"{resource.readable_id}+{slugify(run.semester)}_{run.year}"
        )
        resource.runs.exclude(pk=run.pk).delete()
        resource.save()


def revert_ocw_readable_id(apps, schema_editor):
    """
    Revert readable_id and course.extra_course_numbers for existing
    OCW learning resources
    """
    LearningResource = apps.get_model("learning_resources", "LearningResource")
    for resource in LearningResource.objects.filter(
        platform__platform=PlatformType.ocw.value
    ).select_related("course"):
        resource.readable_id = resource.readable_id.split("+")[0]
        resource.save()


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0019_departments"),
    ]
    operations = [
        migrations.RunPython(update_ocw_readable_id, revert_ocw_readable_id),
    ]
