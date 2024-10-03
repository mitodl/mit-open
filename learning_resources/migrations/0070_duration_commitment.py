# Generated by Django 4.2.16 on 2024-10-01 17:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources", "0069_learningresource_ocw_topics"),
    ]

    operations = [
        migrations.AddField(
            model_name="learningresource",
            name="duration",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="learningresource",
            name="time_commitment",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="learningresourcerun",
            name="duration",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="learningresourcerun",
            name="time_commitment",
            field=models.CharField(blank=True, max_length=128),
        ),
    ]
