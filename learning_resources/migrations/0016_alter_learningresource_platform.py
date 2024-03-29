# Generated by Django 4.1.10 on 2023-09-29 17:27

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0015_platform_name"),
    ]

    operations = [
        migrations.AlterField(
            model_name="learningresource",
            name="platform",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="learning_resources.learningresourceplatform",
            ),
        ),
    ]
