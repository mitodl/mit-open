# Generated by Django 2.1.2 on 2018-12-11 14:12

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [("profiles", "0009_add_userwebsite")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="location",
            field=django.contrib.postgres.fields.jsonb.JSONField(blank=True, null=True),
        )
    ]
