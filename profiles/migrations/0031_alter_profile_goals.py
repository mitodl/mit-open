# Generated by Django 4.2.14 on 2024-07-29 18:36

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("profiles", "0030_alter_profile_learning_format"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="goals",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(
                    choices=[
                        ("academic-excellence", "Academic Boost"),
                        ("career-growth", "Career Growth"),
                        ("lifelong-learning", "Lifelong Learning"),
                    ],
                    max_length=50,
                ),
                blank=True,
                default=list,
                size=None,
            ),
        ),
    ]