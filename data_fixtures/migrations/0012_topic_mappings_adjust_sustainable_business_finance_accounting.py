"""
Update the topics:
- Add mapping "Sustainability" to "Sustainable Business" for mitxpro, mitpe, see
- Add mapping "Economics & Finance" to "Finance & Accounting" for mitx

"""

from django.db import migrations

from learning_resources.utils import upsert_topic_data_string

forward_map_changes = """
---
topics:
    - children: []
      icon: RiLightbulbFlashLine
      id: d18ae735-9eb0-42ec-982d-798590f78b68
      mappings:
        mitxpro:
        - Sustainability
        mitpe:
        - Sustainability
        see:
        - Sustainability
      name: Sustainable Business
      parent: 58eeca97-031c-432f-89f5-5b6493bf0dd2
    - children: []
      icon: RiBriefcase3Line
      id: b84810f6-b232-4443-9471-eff7823a5f93
      mappings:
        mitpe:
        - Finance
        ocw:
        - Accounting
        - Finance
        see:
        - Finance
        xpro:
        - Finance
        mitx:
        - Economics & Finance
      name: Finance & Accounting
      parent: 99ec5b40-e929-4ad9-bccf-7305ef6938b1
"""

reverse_map_changes = """
---
topics:
    - children: []
      icon: RiLightbulbFlashLine
      id: d18ae735-9eb0-42ec-982d-798590f78b68
      mappings: {}
      name: Sustainable Business
      parent: 58eeca97-031c-432f-89f5-5b6493bf0dd2
    - children: []
      icon: RiBriefcase3Line
      id: b84810f6-b232-4443-9471-eff7823a5f93
      mappings:
        mitpe:
        - Finance
        ocw:
        - Accounting
        - Finance
        see:
        - Finance
        xpro:
        - Finance
      name: Finance & Accounting
      parent: 99ec5b40-e929-4ad9-bccf-7305ef6938b1
"""


def add_new_mapping(apps, schema_editor):
    """Upsert the forward_map_changes data above."""

    upsert_topic_data_string(forward_map_changes)


def rollback_new_mapping(apps, schema_editor):
    """Upsert the reverse_map_changes data above."""

    upsert_topic_data_string(reverse_map_changes)


class Migration(migrations.Migration):
    dependencies = [
        ("data_fixtures", "0011_unit_page_copy_updates"),
    ]

    operations = [migrations.RunPython(add_new_mapping, rollback_new_mapping)]
