# Generated by Django 4.1.10 on 2023-12-14 19:57

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0032_content_tags"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="contentfile",
            name="learning_resource_types",
        ),
    ]
