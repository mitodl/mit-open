# Generated by Django 4.2.11 on 2024-05-09 19:23

import django.db.models.deletion
import django.db.models.functions.text
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0046_learningresource_certification"),
    ]

    operations = [
        migrations.AddField(
            model_name="learningresourcetopic",
            name="parent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="learning_resources.learningresourcetopic",
            ),
        ),
        migrations.AlterField(
            model_name="learningresourcetopic",
            name="name",
            field=models.CharField(max_length=128),
        ),
        migrations.AddConstraint(
            model_name="learningresourcetopic",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Lower("name"), name="unique_lower_name"
            ),
        ),
    ]
