# Generated by Django 2.2.13 on 2020-09-16 13:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("course_catalog", "0079_ocw_slugs")]

    operations = [
        migrations.AddField(
            model_name="contentfile",
            name="image_src",
            field=models.URLField(blank=True, null=True),
        )
    ]
