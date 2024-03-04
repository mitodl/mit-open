import json
from pathlib import Path

from django.conf import settings
from django.db import transaction

from learning_resources.models import (
    LearningResourceOfferor,
    LearningResourcePlatform,
)


def upsert_offered_by_data():
    """
    Upsert LearningResourceOfferor data
    """
    with Path.open(
        Path(settings.BASE_DIR) / "learning_resources" / "fixtures" / "offered_by.json"
    ) as inf:
        offered_by_json = json.load(inf)
        offerors = []
        with transaction.atomic():
            for offeror in offered_by_json:
                offeror_fields = offeror["fields"]
                LearningResourceOfferor.objects.update_or_create(
                    name=offeror_fields["name"],
                    defaults=offeror_fields,
                )
                offerors.append(offeror_fields["name"])
            LearningResourceOfferor.objects.exclude(name__in=offerors).delete()


def upsert_platform_data():
    """
    Upsert LearningResourcePlatform data
    """
    with Path.open(
        Path(settings.BASE_DIR) / "learning_resources" / "fixtures" / "platforms.json"
    ) as inf:
        platform_json = json.load(inf)
        platforms = []
        with transaction.atomic():
            for platform in platform_json:
                platform_fields = platform["fields"]
                LearningResourcePlatform.objects.update_or_create(
                    code=platform_fields["code"],
                    defaults=platform_fields,
                )
                platforms.append(platform_fields["code"])
            LearningResourcePlatform.objects.exclude(code__in=platforms).delete()
        return platforms
