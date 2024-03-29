# Generated by Django 2.1.2 on 2018-12-06 22:13

import django.contrib.postgres.fields.jsonb
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="WidgetInstance",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("widget_type", models.CharField(max_length=200)),
                ("configuration", django.contrib.postgres.fields.jsonb.JSONField()),
                ("position", models.PositiveIntegerField()),
                ("title", models.CharField(max_length=200)),
            ],
            options={"ordering": ["position"]},
        ),
        migrations.CreateModel(
            name="WidgetList",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                )
            ],
        ),
        migrations.AddField(
            model_name="widgetinstance",
            name="widget_list",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="widgets",
                to="widgets.WidgetList",
            ),
        ),
        migrations.AddIndex(
            model_name="widgetinstance",
            index=models.Index(
                fields=["widget_list", "position"], name="widget_list_position_index"
            ),
        ),
    ]
