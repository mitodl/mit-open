# Generated by Django 4.1.10 on 2023-11-21 15:20

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0026_rename_platform_code"),
    ]

    operations = [
        migrations.AlterField(
            model_name="learningresourceofferor",
            name="code",
            field=models.CharField(max_length=12, unique=True),
        ),
    ]
