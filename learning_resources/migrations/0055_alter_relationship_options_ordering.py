# Generated by Django 4.2.13 on 2024-06-25 16:54

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        (
            "learning_resources",
            "0054_rename_description_learningresourceofferor_value_prop",
        ),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="learningresourcerelationship",
            options={"ordering": ["position"]},
        ),
        migrations.AlterModelOptions(
            name="userlistrelationship",
            options={"ordering": ["position"]},
        ),
    ]
