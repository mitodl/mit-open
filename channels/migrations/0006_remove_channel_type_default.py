# Generated by Django 4.2.11 on 2024-05-14 14:25

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("channels", "0005_alter_fieldchannel_configuration"),
    ]

    operations = [
        migrations.AlterField(
            model_name="fieldchannel",
            name="channel_type",
            field=models.CharField(
                choices=[
                    ("topic", "Topic"),
                    ("department", "Department"),
                    ("offeror", "Offeror"),
                    ("pathway", "Pathway"),
                ],
                max_length=100,
            ),
        ),
    ]
