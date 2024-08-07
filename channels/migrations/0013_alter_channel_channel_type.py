# Generated by Django 4.2.14 on 2024-07-17 12:46

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("channels", "0012_alter_channelunitdetail_unit"),
    ]

    operations = [
        migrations.AlterField(
            model_name="channel",
            name="channel_type",
            field=models.CharField(
                choices=[
                    ("topic", "Topic"),
                    ("department", "Department"),
                    ("unit", "Unit"),
                    ("pathway", "Pathway"),
                ],
                db_index=True,
                max_length=100,
            ),
        ),
    ]
