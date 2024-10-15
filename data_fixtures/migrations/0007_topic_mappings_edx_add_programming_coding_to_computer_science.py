"""
Update the topic map for edX; resolve Computer Science (in edX) to both
Computer Science and Programming & Coding.
"""

from django.db import migrations

from data_fixtures.utils import upsert_topic_data_string

map_changes = """
---
topics:
    - icon: RiRobot2Line
      id: c06109bf-cff8-4873-b04b-f5e66e3e1764
      mappings:
        mitx:
          - Electronics
        ocw:
          - Technology
      name: Data Science, Analytics & Computer Technology
      children:
      - children: []
        icon: RiRobot2Line
        id: 4cd6156e-51a0-4da4-add4-6f81e106cd43
        mappings:
          ocw:
            - Programming Languages
            - Software Design and Engineering
          mitx:
            - Computer Science
        name: Programming & Coding
"""

rollback_map_changes = """
---
topics:
    - icon: RiRobot2Line
      id: c06109bf-cff8-4873-b04b-f5e66e3e1764
      mappings:
        mitx:
          - Electronics
        ocw:
          - Technology
      name: Data Science, Analytics & Computer Technology
      children:
      - children: []
        icon: RiRobot2Line
        id: 4cd6156e-51a0-4da4-add4-6f81e106cd43
        mappings:
          ocw:
            - Programming Languages
        name: Programming & Coding
"""


def add_new_mapping(apps, schema_editor):
    """Upsert the map_changes data above."""

    upsert_topic_data_string(map_changes)


def rollback_new_mapping(apps, schema_editor):
    """Upsert the rollback_map_changes data above."""

    upsert_topic_data_string(rollback_map_changes)


class Migration(migrations.Migration):
    """Perform the migration."""

    dependencies = [
        ("data_fixtures", "0006_update_parent_topic_channel_descriptions"),
    ]

    operations = [migrations.RunPython(add_new_mapping, rollback_new_mapping)]
