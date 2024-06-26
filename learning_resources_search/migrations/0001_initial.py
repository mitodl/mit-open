# Generated by Django 4.2.11 on 2024-04-04 17:24

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PercolateQuery",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_on", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                ("original_query", models.JSONField()),
                ("query", models.JSONField()),
                (
                    "source_type",
                    models.CharField(
                        choices=[
                            ("search_subscription_type", "search_subscription_type")
                        ],
                        max_length=255,
                    ),
                ),
                (
                    "users",
                    models.ManyToManyField(
                        related_name="percolate_queries", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
