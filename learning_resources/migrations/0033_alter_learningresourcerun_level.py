# Generated by Django 4.1.10 on 2023-12-15 13:59

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0032_remove_contentfile_learning_resource_types"),
    ]

    operations = [
        migrations.AlterField(
            model_name="learningresourcerun",
            name="level",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=128), default=list, size=None
            ),
        ),
    ]
