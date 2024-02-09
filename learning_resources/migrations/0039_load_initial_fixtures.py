"""Manually generated migration to load initial fixtures"""

from django.core.management import call_command
from django.db import migrations


def forwards_func(apps, _schema_editor):
    """
    Load initial data required by management commands
    """
    call_command("loaddata", "platforms", verbosity=2)
    call_command("loaddata", "offered_by", verbosity=2)
    call_command("loaddata", "departments", verbosity=2)


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0038_use_keys_for_levels"),
    ]

    operations = [
        migrations.RunPython(forwards_func, reverse_code=migrations.RunPython.noop),
    ]
