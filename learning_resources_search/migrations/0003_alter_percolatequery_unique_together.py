# Generated by Django 4.2.11 on 2024-04-17 17:06

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("learning_resources_search", "0002_alter_percolatequery_unique_together"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="percolatequery",
            unique_together={("source_type", "original_query")},
        ),
    ]