# Generated by Django 4.2.9 on 2024-01-23 15:44

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("authentication", "0002_blockediprange"),
    ]

    operations = [
        migrations.AlterField(
            model_name="blockedemailregex",
            name="created_on",
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name="blockediprange",
            name="created_on",
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
    ]
