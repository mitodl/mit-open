# Generated by Django 2.2.24 on 2021-12-07 14:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("course_catalog", "0085_course_extra_course_numbers")]

    operations = [
        migrations.AlterField(
            model_name="video",
            name="duration",
            field=models.CharField(blank=True, max_length=11, null=True),
        )
    ]
