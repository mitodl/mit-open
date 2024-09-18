"""
Update the topics; update the icons for Data Science, Analytics & Computer
Technology and the Innovation & Entrepreneurship topics.

This is just an icon revision so doing it directly.
"""

from django.db import migrations


def _update_icons(model, topic, icon):
    """Perform the update."""

    topic = model.objects.get(topic_uuid=topic)
    topic.icon = icon
    topic.save()


def update_topic_icons(apps, schema_editor):
    """Update topic icons."""

    LearningResourceTopic = apps.get_model(
        "learning_resources", "LearningResourceTopic"
    )

    # Data Science, Analytics & Computer Technology
    _update_icons(
        LearningResourceTopic, "c06109bf-cff8-4873-b04b-f5e66e3e1764", "RiLineChartLine"
    )
    # Innovation & Entrepreneurship
    _update_icons(
        LearningResourceTopic, "c0f67cd5-c3f2-458c-85e7-a2144c6e5e9d", "RiSpaceShipLine"
    )


def unupdate_topic_icons(apps, schema_editor):
    """Roll back topic icons update."""

    LearningResourceTopic = apps.get_model(
        "learning_resources", "LearningResourceTopic"
    )

    # Data Science, Analytics & Computer Technology
    _update_icons(
        LearningResourceTopic, "c06109bf-cff8-4873-b04b-f5e66e3e1764", "RiRobot2Line"
    )
    # Innovation & Entrepreneurship
    _update_icons(
        LearningResourceTopic, "c0f67cd5-c3f2-458c-85e7-a2144c6e5e9d", "RiTeamLine"
    )


class Migration(migrations.Migration):
    dependencies = [
        ("data_fixtures", "0009_topics_update_engineering_add_manufacturing"),
    ]

    operations = [
        migrations.RunPython(update_topic_icons, unupdate_topic_icons),
    ]
