"""
Update the topics; add Manufacturing under Engineering
This is intended to fix https://github.com/mitodl/hq/issues/5076 - no additional
mappings since the topics for Principals of Manufacturing include "Manufacturing"
so it should match on name directly.
"""

from django.db import migrations

from channels.constants import ChannelType
from learning_resources.utils import upsert_topic_data_string

map_changes = """
---
topics:
    - icon:
      id: 4176e385-92c5-4e02-b3cc-4f34d9a4bf40
      mappings: []
      name: Manufacturing
      children: []
      parent: 952604ab-ae23-45b3-a040-0e5f26fe42df
"""


def add_new_mapping(apps, schema_editor):
    """Upsert the map_changes data above."""

    upsert_topic_data_string(map_changes)


def rollback_new_mapping(apps, schema_editor):
    """Remove the Manufacturing topic."""

    LearningResourceTopic = apps.get_model(
        "learning_resources", "LearningResourceTopic"
    )
    Channel = apps.get_model("channels", "Channel")

    topic = LearningResourceTopic.objects.filter(
        topic_uuid="4176e385-92c5-4e02-b3cc-4f34d9a4bf40",
    ).get()

    Channel.objects.filter(
        channel_type=ChannelType.topic.name,
        topic_detail__topic=topic,
    ).all().delete()

    topic.delete()


class Migration(migrations.Migration):
    dependencies = [
        (
            "data_fixtures",
            "0008_unpublish_empty_topic_channels",
        ),
    ]

    operations = [migrations.RunPython(add_new_mapping, rollback_new_mapping)]
