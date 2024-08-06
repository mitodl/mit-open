from django.db import migrations

fixtures = [
    {
        "name": "mitpe",
        "channel_configuration": {
            "heading": (
                "Offering lifelong learning opportunities that prepare engineering, "
                "science, and technology professionals to address complex industry "
                "challenges."
            ),
        },
    },
]


def update_copy(apps, schema_editor):
    Channel = apps.get_model("channels", "Channel")
    for fixture in fixtures:
        channel_configuration_updates = fixture["channel_configuration"]
        channel = Channel.objects.get(name=fixture["name"])
        if Channel.objects.filter(name=fixture["name"]).exists():
            for key, val in channel_configuration_updates.items():
                channel.configuration[key] = val
            channel.save()


class Migration(migrations.Migration):
    dependencies = [
        ("data_fixtures", "0004_upsert_initial_topic_data"),
    ]

    operations = [
        migrations.RunPython(update_copy, migrations.RunPython.noop),
    ]
