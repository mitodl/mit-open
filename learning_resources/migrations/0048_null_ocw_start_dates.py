# Manually generated

from django.db import migrations

from learning_resources.etl.constants import ETLSource


def depopulate_ocw_start_dates(apps, schema_editor):
    """
    Make all OCW run start dates null
    """
    LearningResourceRun = apps.get_model("learning_resources", "LearningResourceRun")
    LearningResourceRun.objects.filter(
        learning_resource__etl_source=ETLSource.ocw.name
    ).update(start_date=None)


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0047_add_nestable_topics"),
    ]

    operations = [
        migrations.RunPython(
            depopulate_ocw_start_dates, reverse_code=migrations.RunPython.noop
        ),
    ]
