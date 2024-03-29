# Generated by Django 4.1.10 on 2023-09-05 15:20

import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0009_alter_learningresource_resource_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContentFile",
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
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                ("uid", models.CharField(blank=True, max_length=36, null=True)),
                ("key", models.CharField(blank=True, max_length=1024, null=True)),
                ("title", models.CharField(blank=True, max_length=1024, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("image_src", models.URLField(blank=True, null=True)),
                ("url", models.TextField(blank=True, null=True)),
                ("short_url", models.TextField(blank=True, null=True)),
                ("file_type", models.CharField(blank=True, max_length=128, null=True)),
                ("section", models.CharField(blank=True, max_length=512, null=True)),
                (
                    "section_slug",
                    models.CharField(blank=True, max_length=512, null=True),
                ),
                ("content", models.TextField(blank=True, null=True)),
                (
                    "content_title",
                    models.CharField(blank=True, max_length=1024, null=True),
                ),
                (
                    "content_author",
                    models.CharField(blank=True, max_length=1024, null=True),
                ),
                (
                    "content_language",
                    models.CharField(blank=True, max_length=24, null=True),
                ),
                (
                    "content_type",
                    models.CharField(
                        choices=[
                            ("page", "page"),
                            ("file", "file"),
                            ("vertical", "vertical"),
                        ],
                        default="file",
                        max_length=10,
                    ),
                ),
                (
                    "learning_resource_types",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=256),
                        blank=True,
                        null=True,
                        size=None,
                    ),
                ),
                ("published", models.BooleanField(default=True)),
                ("checksum", models.CharField(blank=True, max_length=32, null=True)),
                (
                    "run",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="content_files",
                        to="learning_resources.learningresourcerun",
                    ),
                ),
            ],
            options={
                "verbose_name": "contentfile",
                "unique_together": {("key", "run")},
            },
        ),
    ]
