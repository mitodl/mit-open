from django.db import migrations

from learning_resources.constants import LearningResourceDelivery


def remove_offline_delivery(apps, schema_editor):
    """
    Remove offline delivery from courses and runs
    """
    offline = LearningResourceDelivery.offline.name
    online = LearningResourceDelivery.online.name
    LearningResource = apps.get_model("learning_resources", "LearningResource")
    LearningResourceRun = apps.get_model("learning_resources", "LearningResource")
    LearningResource.objects.filter(delivery__icontains=offline).update(
        delivery=[online]
    )
    LearningResourceRun.objects.filter(delivery__icontains=offline).update(
        delivery=[online]
    )


class Migration(migrations.Migration):
    dependencies = [
        (
            "learning_resources",
            "0066_remove_learningresource_learning_format",
        ),
    ]

    operations = [
        migrations.RunPython(
            remove_offline_delivery, reverse_code=migrations.RunPython.noop
        ),
    ]
