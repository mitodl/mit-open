# Generated by Django 4.2.13 on 2024-06-25 15:30

import logging
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.db import migrations

from data_fixtures.utils import (
    upsert_department_data,
    upsert_offered_by_data,
    upsert_platform_data,
    upsert_school_data,
    upsert_topic_data_file,
)

logger = logging.getLogger(__name__)

"""
Fix an issue with PIL's logger when running in test
https://github.com/camptocamp/pytest-odoo/issues/15
"""
pil_logger = logging.getLogger("PIL")
pil_logger.setLevel(logging.INFO)

fixtures = [
    {
        "attestant_name": "Maria Eduarda",
        "title": "Independent Learner, Brazil",
        "quote": (
            "I am not exaggerating when I say MIT OpenCourseWare "
            "has changed my life significantly for the better… "
            "I would never have had the opportunity to "
            "take Calculus during high school, let alone Solid State Chemistry. "
            "These courses have greatly expanded my "
            "interests and opportunities and I'm forever grateful for that."
        ),
        "position": 1,
        "offerors": ["ocw"],
    },
    {
        "attestant_name": "Chansa Kabwe",
        "title": "Independent Learner, Zambia",
        "quote": (
            "OpenCourseWare continues to be a big part of my career."
            " My foundation is linked to it — I don't know if "
            "I would be the same engineer today if not for OpenCourseWare."
        ),
        "position": 1,
        "offerors": ["ocw"],
    },
    {
        "attestant_name": "Emmanuel Kasigazi",
        "title": "Entrepreneur, Uganda",
        "quote": (
            "This is what OpenCourseWare has enabled me to do: "
            "I get the chance to not only watch the "
            "future happen, but I can actually be a part of it and create it."
        ),
        "position": 1,
        "offerors": ["ocw"],
    },
    {
        "attestant_name": "Arthur Julio Nelson",
        "title": "Brand Strategy Lead, Google",
        "quote": (
            "The Bootcamp is, well, it's an accelerator "
            "meets a creativity incubator. "
            "It's all of these things mashed into one. "
            "If you come into the Bootcamp with a "
            "purpose and desire for impact and where you want "
            "to channel it, the Bootcamp will help you unleash it."
        ),
        "position": 1,
        "offerors": ["bootcamps"],
    },
    {
        "attestant_name": "Jasmine Latham",
        "title": "Lead Data Scientist, Office for National Statistics",
        "quote": (
            "I am very pleased with the course content, "
            "it is exactly the level I am looking for. "
            "Each professor/course presenter has packed "
            "a lot of information and has explained complex "
            "algorithms in good detail. "
            "Some with good sense of humor. Thank you very much."
        ),
        "position": 1,
        "offerors": ["xpro"],
    },
    {
        "attestant_name": "Lauren Moscioni",
        "title": "Associate, Morgan Stanley",
        "quote": (
            "Coming from the finance sector, "
            "I wanted to learn more about real estate as an "
            "alternative investment for ultra-high-net-worth clients. "
            "What I got from MIT was a well-rounded, "
            "holistic view of the state of the field."
        ),
        "position": 1,
        "offerors": ["mitpe"],
    },
    {
        "attestant_name": "Sebastian Bello",
        "title": "MicroMasters learner",
        "quote": (
            "I did the Micromaster in supply chain, "
            "what motivated me the most to finish it was "
            "to have a certificate in supply chain "
            "from MIT to improve my career. I was so engaged with "
            "the courses that I wanted to continue learning, "
            "now I'm doing the Supply Chain Management Master's  at MIT."
        ),
        "position": 1,
        "offerors": ["mitx"],
    },
    {
        "attestant_name": "John Goodloe",
        "title": (
            "Senior Director for Society Business Solutions, "
            "American Chemical Society (ACS)"
        ),
        "quote": (
            "The courses at MIT Sloan Executive Education brought together "
            "true leaders from across the world. You're in classes with diplomats, "
            "CEOs, heads of family businesses and "
            "Fortune 500s—every course is a different mix."
        ),
        "position": 1,
        "offerors": ["see"],
    },
    {
        "attestant_name": "Linda Obregon",
        "title": "Founder and CEO",
        "quote": (
            "The program experience was 10-fold compared to what I expected. "
            "They not only taught me how to create "
            "a company in a week, but they gave me a "
            "supportive network of the best "
            "and brightest minds. After I left the Bootcamp, "
            "I founded a startup that uses science and"
            " plants to develop high-protein and tasty new foods."
        ),
        "position": 1,
        "offerors": ["bootcamps"],
    },
    {
        "attestant_name": "Murali Thyagarajan",
        "title": "DBA & Application Support, NASDAQ",
        "quote": (
            "The course was easy to understand and had depth. "
            "All the concepts were clearly laid out and explained. "
            "This is the best course I have come across on this topic."
        ),
        "position": 2,
        "offerors": ["xpro"],
    },
    {
        "attestant_name": "Claudio Mirti",
        "title": "Senior Advanced Analytics and AI Specialist, Microsoft",
        "quote": (
            "The Certificate Program in Machine Learning and AI is a great experience. "
            "You get a lot of powerful insights during "
            "exchanges with the professors and other "
            "students—and you learn how to incorporate the "
            "material into your daily work."
        ),
        "position": 2,
        "offerors": ["mitpe"],
    },
    {
        "attestant_name": "Stephen Okiya",
        "title": "MITx Learner",
        "quote": (
            "I am really grateful for the efforts by MIT in coming up with innovative "
            "ways of making quality education affordable "
            "and accessible to everyone all over the world. "
            "I am sure that the programs impact the lives of millions of "
            "people either directly or indirectly "
            "hence making the world a better place."
        ),
        "position": 2,
        "offerors": ["mitx"],
    },
    {
        "attestant_name": "Brenda Patel",
        "title": "CEO, Bonova Advisory",
        "quote": (
            "You're a part of an ecosystem that is a life-long community of "
            "people with the same goal to create something new and valuable. "
            "It's an investment of five days, but it stays with you forever."
        ),
        "position": 2,
        "offerors": ["see"],
    },
    {
        "attestant_name": "Emily R. Wright",
        "title": "Versatile Technologist",
        "quote": (
            "This is an awesome program for emerging leaders "
            "and for those currently in leadership positions. "
            "The knowledge, tools, and techniques "
            "are very useful to companies worldwide. "
            "I would highly recommend this program to all levels of employees."
        ),
        "position": 3,
        "offerors": ["xpro"],
    },
    {
        "attestant_name": "Anesha Santhanam",
        "title": "MITx Learner",
        "quote": (
            "I recently completed an MITx course in Python, "
            "and it was phenomenal. I looked into this course to "
            "give me a better foundation and a deeper "
            "understanding so I could use Python "
            "in other settings and applications. "
            "I'm using what I learned everyday to further my passion, "
            "so thank you for providing me with this opportunity!"
        ),
        "position": 3,
        "offerors": ["mitx"],
    },
]


def load_initial_fixtures(apps, schema_editor):
    """
    Load initial static fixtures required by
    management commands further down
    """
    offerors = upsert_offered_by_data()
    departments = upsert_department_data()
    schools = upsert_school_data()
    platforms = upsert_platform_data()
    topics = upsert_topic_data_file()
    logout = (
        f"Updated:"
        f"   {offerors} offerors"
        f"   {departments} departments"
        f"   {schools} schools"
        f"   {platforms} platforms"
        f"   {topics} topics"
    )
    logger.info(logout)


def load_fixtures(apps, schema_editor):
    """
    Load fixtures for testimonials
    """
    Attestation = apps.get_model("testimonials", "Attestation")
    LearningResourceOfferor = apps.get_model(
        "learning_resources", "LearningResourceOfferor"
    )

    for fixture in fixtures:
        offerors = fixture.pop("offerors")
        testimonial, _ = Attestation.objects.get_or_create(
            attestant_name=fixture["attestant_name"],
            title=fixture["title"],
            defaults=fixture,
        )
        # make sure related offerors exists in system before setting
        if LearningResourceOfferor.objects.filter(pk__in=offerors).count() == len(
            offerors
        ):
            testimonial.offerors.set(offerors)
        if not testimonial.avatar:
            """
            Save the image from fixture so alternate sizes are generated
            """
            with Path.open(
                f"{settings.BASE_DIR}/testimonials/fixtures/avatars/{fixture['attestant_name']}.png",
                "rb",
            ) as imagefile:
                testimonial.avatar.save("avatar.png", File(imagefile), save=True)


class Migration(migrations.Migration):
    dependencies = []

    operations = [
        migrations.RunPython(load_initial_fixtures, migrations.RunPython.noop),
        migrations.RunPython(load_fixtures, migrations.RunPython.noop),
    ]
