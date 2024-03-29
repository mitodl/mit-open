# Generated by Django 4.2.11 on 2024-03-15 13:43

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("profiles", "0018_alter_programletter_certificate_and_more"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="programcertificate",
            options={"managed": False},
        ),
        migrations.AlterField(
            model_name="programletter",
            name="certificate",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="profiles.programcertificate",
            ),
        ),
    ]
