# Generated by Django 2.1.7 on 2019-05-03 17:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("course_catalog", "0021_program_name_program_type")]

    operations = [
        migrations.AddField(
            model_name="course",
            name="location",
            field=models.CharField(blank=True, max_length=128, null=True),
        )
    ]
