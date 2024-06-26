# Generated by Django 4.2.13 on 2024-06-04 09:52

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0052_learningresource_certification_type"),
        ("profiles", "0025_add_onboarding_fields"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="profile",
            name="course_format",
        ),
        migrations.RemoveField(
            model_name="profile",
            name="interests",
        ),
        migrations.AddField(
            model_name="profile",
            name="learning_format",
            field=models.CharField(
                blank=True,
                choices=[
                    ("online", "Online"),
                    ("hybrid", "Hybrid"),
                    ("in_person", "In person"),
                ],
                default="",
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="profile",
            name="topic_interests",
            field=models.ManyToManyField(
                limit_choices_to={"parent": None},
                to="learning_resources.learningresourcetopic",
            ),
        ),
    ]
