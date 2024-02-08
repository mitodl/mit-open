"""Manually generated migration to update OCW contentfile urls"""

from django.conf import settings
from django.db import migrations
from django.db.models import F, Value
from django.db.models.functions import Replace

from learning_resources.etl.constants import ETLSource


def update_urls(apps, schema_editor):
    """
    Convert relative urls to absolute urls
    """
    ContentFile = apps.get_model("learning_resources", "ContentFile")
    base_url = f"{settings.OCW_BASE_URL.rstrip('/')}/"
    ContentFile.objects.filter(
        run__learning_resource__etl_source=ETLSource.ocw.value
    ).filter(url__startswith="../").update(
        url=Replace(F("url"), Value("../"), Value(base_url))
    )


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0035_alter_created_on"),
    ]

    operations = [
        migrations.RunPython(update_urls, reverse_code=migrations.RunPython.noop),
    ]
