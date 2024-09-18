"""
Copy updates for mitx offeror
"""

from django.db import migrations

fixtures = [
    {
        "name": "mitx",
        "offeror_configuration": {"content_types": ["Academic"]},
    },
]


def update_copy(apps, schema_editor):
    LearningResourceOfferor = apps.get_model(
        "learning_resources", "LearningResourceOfferor"
    )
    for fixture in fixtures:
        offeror_configuration_updates = fixture["offeror_configuration"]
        if LearningResourceOfferor.objects.filter(code=fixture["name"]).exists():
            offeror = LearningResourceOfferor.objects.get(code=fixture["name"])
            for key, val in offeror_configuration_updates.items():
                setattr(offeror, key, val)
            offeror.save()


class Migration(migrations.Migration):
    dependencies = [
        ("data_fixtures", "0010_topics_update_icons_for_innovation_data_science"),
    ]

    operations = [
        migrations.RunPython(update_copy, migrations.RunPython.noop),
    ]
