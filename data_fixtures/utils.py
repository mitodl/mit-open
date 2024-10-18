import json
from pathlib import Path

import yaml
from django.db import transaction

from learning_resources.models import (
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourcePlatform,
    LearningResourceSchool,
)
from learning_resources.utils import (
    _walk_topic_map,
    department_delete_actions,
    offeror_delete_actions,
    offeror_upserted_actions,
)


@transaction.atomic()
def upsert_topic_data_file(
    config_path: str = "learning_resources/data/topics.yaml",
) -> None:
    """
    Load the topics from a yaml file.

    The yaml file should have a root "topics" key, and then any number of topic
    records beneath it. See _walk_topic_map for an explanation of the record
    format.

    Args:
    - config_path (str): the path to the topics file.
    Returns:
    - None
    """

    with Path.open(Path(config_path)) as topic_file:
        topic_file_yaml = topic_file.read()

    topics = yaml.safe_load(topic_file_yaml)

    _walk_topic_map(topics["topics"])


@transaction.atomic()
def upsert_offered_by_data():
    """
    Upsert LearningResourceOfferor data
    """
    offerors = []
    with Path.open(Path(__file__).parent / "fixtures" / "offered_by.json") as inf:
        offered_by_json = json.load(inf)
        for offeror in offered_by_json:
            offeror_fields = offeror["fields"]
            offered_by, _ = LearningResourceOfferor.objects.update_or_create(
                code=offeror_fields["code"],
                defaults=offeror_fields,
            )
            offeror_upserted_actions(offered_by, overwrite=True)
            offerors.append(offeror_fields["name"])
        invalid_offerors = LearningResourceOfferor.objects.exclude(name__in=offerors)
        for offeror in invalid_offerors:
            offeror_delete_actions(offeror)
    return offerors


@transaction.atomic()
def upsert_department_data():
    """
    Upsert LearningResourceDepartment data
    """
    departments = []
    with Path.open(Path(__file__).parent / "fixtures" / "departments.json") as inf:
        departments_json = json.load(inf)
        for dept in departments_json:
            department_fields = dept["fields"]
            LearningResourceDepartment.objects.update_or_create(
                department_id=department_fields["department_id"],
                defaults=department_fields,
            )
            departments.append(department_fields["name"])
        invalid_departments = LearningResourceDepartment.objects.exclude(
            name__in=departments
        ).all()
        for invalid_department in invalid_departments:
            department_delete_actions(invalid_department)
    return departments


@transaction.atomic()
def upsert_school_data():
    """
    Upsert LearningResourceSchool data
    """
    schools = []
    with Path.open(Path(__file__).parent / "fixtures" / "schools.json") as inf:
        schools_json = json.load(inf)
        for school in schools_json:
            school_fields = school["fields"]
            LearningResourceSchool.objects.update_or_create(
                id=school_fields["id"],
                defaults=school_fields,
            )
            schools.append(school_fields["name"])
        LearningResourceSchool.objects.exclude(name__in=schools).delete()
    return schools


@transaction.atomic()
def upsert_platform_data():
    """
    Upsert LearningResourcePlatform data
    """
    platforms = []
    with Path.open(Path(__file__).parent / "fixtures" / "platforms.json") as inf:
        platform_json = json.load(inf)
        for platform in platform_json:
            platform_fields = platform["fields"]
            LearningResourcePlatform.objects.update_or_create(
                code=platform_fields["code"],
                defaults=platform_fields,
            )
            platforms.append(platform_fields["code"])
        LearningResourcePlatform.objects.exclude(code__in=platforms).delete()
    return platforms


@transaction.atomic()
def upsert_topic_data_string(yaml_data: str) -> None:
    """
    Load the topics from a yaml string.

    The yaml string should be formatted in the same way that it is for
    upsert_topic_data_file - this function exists just to allow you to specify
    the data as a string so you can roll it into a migration file in the
    data_fixtures app.

    Args:
    - yaml_data (str): the yaml to process
    Returns:
    - None
    """

    topics = yaml.safe_load(yaml_data)

    _walk_topic_map(topics["topics"])
