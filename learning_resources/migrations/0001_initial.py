# Generated by Django 4.1.10 on 2023-08-10 16:36

import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="LearningResource",
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
                ("readable_id", models.CharField(max_length=128)),
                ("title", models.CharField(max_length=256)),
                ("description", models.TextField(blank=True, null=True)),
                ("full_description", models.TextField(blank=True, null=True)),
                ("last_modified", models.DateTimeField(blank=True, null=True)),
                ("published", models.BooleanField(db_index=True, default=True)),
                (
                    "languages",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=24),
                        blank=True,
                        null=True,
                        size=None,
                    ),
                ),
                ("url", models.URLField(max_length=2048, null=True)),
                ("resource_type", models.CharField(max_length=24)),
                (
                    "prices",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.DecimalField(decimal_places=2, max_digits=12),
                        blank=True,
                        null=True,
                        size=None,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="LearningResourceContentTag",
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
                ("name", models.CharField(max_length=128, unique=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="LearningResourceDepartment",
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
                ("department_id", models.CharField(max_length=6, unique=True)),
                ("name", models.CharField(max_length=256)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="LearningResourceImage",
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
                ("url", models.TextField(blank=True, max_length=2048, null=True)),
                (
                    "description",
                    models.CharField(blank=True, max_length=1024, null=True),
                ),
                ("alt", models.CharField(blank=True, max_length=1024, null=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="LearningResourceInstructor",
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
                ("first_name", models.CharField(blank=True, max_length=128, null=True)),
                ("last_name", models.CharField(blank=True, max_length=128, null=True)),
                (
                    "full_name",
                    models.CharField(
                        blank=True, max_length=256, null=True, unique=True
                    ),
                ),
            ],
            options={
                "ordering": ["last_name"],
            },
        ),
        migrations.CreateModel(
            name="LearningResourceOfferor",
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
                ("name", models.CharField(max_length=256, unique=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="LearningResourcePlatform",
            fields=[
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                (
                    "platform",
                    models.CharField(max_length=12, primary_key=True, serialize=False),
                ),
                ("url", models.URLField(blank=True, null=True)),
                (
                    "audience",
                    models.CharField(
                        choices=[
                            ("Open Content", "Open Content"),
                            ("Professional Offerings", "Professional Offerings"),
                        ],
                        max_length=24,
                    ),
                ),
                ("is_edx", models.BooleanField(default=False)),
                ("has_content_files", models.BooleanField(default=False)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="LearningResourceTopic",
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
                ("name", models.CharField(max_length=128, unique=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Course",
            fields=[
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                (
                    "learning_resource",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="course",
                        serialize=False,
                        to="learning_resources.learningresource",
                    ),
                ),
                (
                    "extra_course_numbers",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=128),
                        blank=True,
                        null=True,
                        size=None,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="learningresource",
            name="department",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="learning_resources.learningresourcedepartment",
            ),
        ),
        migrations.AddField(
            model_name="learningresource",
            name="image",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="learning_resources.learningresourceimage",
            ),
        ),
        migrations.AddField(
            model_name="learningresource",
            name="offered_by",
            field=models.ManyToManyField(
                to="learning_resources.learningresourceofferor"
            ),
        ),
        migrations.AddField(
            model_name="learningresource",
            name="platform",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.RESTRICT,
                to="learning_resources.learningresourceplatform",
            ),
        ),
        migrations.AddField(
            model_name="learningresource",
            name="resource_content_tags",
            field=models.ManyToManyField(
                to="learning_resources.learningresourcecontenttag"
            ),
        ),
        migrations.AddField(
            model_name="learningresource",
            name="topics",
            field=models.ManyToManyField(to="learning_resources.learningresourcetopic"),
        ),
        migrations.CreateModel(
            name="Program",
            fields=[
                ("created_on", models.DateTimeField(auto_now_add=True)),
                ("updated_on", models.DateTimeField(auto_now=True)),
                (
                    "learning_resource",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="program",
                        serialize=False,
                        to="learning_resources.learningresource",
                    ),
                ),
                (
                    "courses",
                    models.ManyToManyField(
                        limit_choices_to={"learning_resource__resource_type": "course"},
                        related_name="programs",
                        to="learning_resources.learningresource",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="LearningResourceRun",
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
                ("run_id", models.CharField(max_length=128)),
                ("title", models.CharField(max_length=256)),
                ("description", models.TextField(blank=True, null=True)),
                ("full_description", models.TextField(blank=True, null=True)),
                ("last_modified", models.DateTimeField(blank=True, null=True)),
                ("published", models.BooleanField(db_index=True, default=True)),
                (
                    "languages",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=24),
                        blank=True,
                        null=True,
                        size=None,
                    ),
                ),
                ("url", models.URLField(max_length=2048, null=True)),
                ("level", models.CharField(blank=True, max_length=128, null=True)),
                ("slug", models.CharField(blank=True, max_length=1024, null=True)),
                (
                    "availability",
                    models.CharField(blank=True, max_length=128, null=True),
                ),
                ("semester", models.CharField(blank=True, max_length=20, null=True)),
                ("year", models.IntegerField(blank=True, null=True)),
                (
                    "start_date",
                    models.DateTimeField(blank=True, db_index=True, null=True),
                ),
                ("end_date", models.DateTimeField(blank=True, null=True)),
                ("enrollment_start", models.DateTimeField(blank=True, null=True)),
                ("enrollment_end", models.DateTimeField(blank=True, null=True)),
                (
                    "prices",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.DecimalField(decimal_places=2, max_digits=12),
                        blank=True,
                        null=True,
                        size=None,
                    ),
                ),
                (
                    "image",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="learning_resources.learningresourceimage",
                    ),
                ),
                (
                    "instructors",
                    models.ManyToManyField(
                        blank=True,
                        related_name="runs",
                        to="learning_resources.learningresourceinstructor",
                    ),
                ),
                (
                    "learning_resource",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="runs",
                        to="learning_resources.learningresource",
                    ),
                ),
            ],
            options={
                "unique_together": {("learning_resource", "run_id")},
            },
        ),
        migrations.AlterUniqueTogether(
            name="learningresource",
            unique_together={("platform", "readable_id")},
        ),
    ]
