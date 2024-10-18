"""Utils for learning resources"""

import logging
import re

import rapidjson
import requests
import yaml
from botocore.exceptions import ClientError
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.db import transaction
from django.db.models import Q
from retry import retry

from learning_resources.constants import (
    GROUP_STAFF_LISTS_EDITORS,
    LearningResourceRelationTypes,
    semester_mapping,
)
from learning_resources.hooks import get_plugin_manager
from learning_resources.models import (
    LearningResource,
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourceRelationship,
    LearningResourceRun,
    LearningResourceTopic,
    LearningResourceTopicMapping,
    UserListRelationship,
)
from main.utils import generate_filepath

log = logging.getLogger()


def user_list_image_upload_uri(instance, filename):
    """
    upload_to handler for user-created UserList image
    """
    return generate_filepath(
        filename, instance.author.username, instance.title, "user_list"
    )


def staff_list_image_upload_uri(instance, filename):
    """
    upload_to handler for user-created UserList image
    """
    return generate_filepath(filename, "staff_list", instance.title, "")


# NOTE: this is unused, but a migration references it, so we'll leave it until we decide to squash migrations or something  # noqa: E501
def program_image_upload_uri(instance, filename):
    """
    upload_to handler for Program image
    """
    return generate_filepath(filename, instance.title, "", "program")


def get_year_and_semester(course_run):
    """
    Parse year and semester out of course run key. If course run key cannot be parsed attempt to get year from start.

    Args:
        course_run (dict): The JSON object representing the particular course run

    Returns:
        tuple (str, str): year, semester

    """  # noqa: E501
    year = course_run.get("year")
    semester = course_run.get("semester")

    if year == "":
        year = None

    if semester == "":
        semester = None

    if not semester and not year:
        match = re.search(
            "[1|2|3]T[0-9]{4}", course_run.get("key")
        )  # e.g. "3T2019" -> Semester "3", Year "2019"
        if match:
            year = int(match.group(0)[-4:])
            semester = semester_mapping.get(match.group(0)[-6:-4])
            return year, semester
        match = re.search(
            "([0-9]{4})_(Spring|Summer|Fall|Winter)", course_run.get("key")
        )
        if match:
            year = int(match.group(1))
            semester = match.group(2)
        else:
            semester = None
            year = course_run.get("start")[:4] if course_run.get("start") else None
    return year, semester


def load_course_blocklist():
    """
    Get a list of blocklisted course ids

    Returns:
        list of str: list of course ids

    """
    blocklist_url = settings.BLOCKLISTED_COURSES_URL
    if blocklist_url is not None:
        response = requests.get(blocklist_url, timeout=settings.REQUESTS_TIMEOUT)
        response.raise_for_status()
        return [str(line, "utf-8") for line in response.iter_lines()]
    return []


def load_course_duplicates(etl_source: str) -> list:
    """
    Get a list of blocklisted course ids for an ETL pipeline source
    Args:
        etl_source (string): the ETL source for which course duplicates are needed
    Returns:
        list of lists of courses which are duplicates of each other
    """
    duplicates_url = settings.DUPLICATE_COURSES_URL
    if duplicates_url is not None:
        response = requests.get(duplicates_url, timeout=settings.REQUESTS_TIMEOUT)
        response.raise_for_status()
        duplicates_for_all_sources = yaml.safe_load(response.text)
        if etl_source in duplicates_for_all_sources:
            return duplicates_for_all_sources[etl_source]
    return []


@retry(
    ClientError, tries=settings.MAX_S3_GET_ITERATIONS, delay=1, backoff=2, jitter=(1, 5)
)
def get_s3_object_and_read(obj):
    """
    Attempts to read S3 data, and tries again up to MAX_S3_GET_ITERATIONS if it encounters an error.
    This helps to prevent read timeout errors from stopping sync.

    Args:
        obj (s3.ObjectSummary): The S3 ObjectSummary we are trying to read

    Returns:
        bytes: The contents of a json file read from S3
    """  # noqa: D401, E501
    return obj.get()["Body"].read()


def safe_load_json(json_string, json_file_key):
    """
    Loads the passed string as a JSON object with exception handing and logging.
    Some OCW JSON content may be malformed.

    Args:
        json_string (str): The JSON contents as a string
        json_file_key (str or bytes): file ID for the JSON file

    Returns:
        JSON (dict): the JSON contents as JSON
    """  # noqa: D401
    try:
        return rapidjson.loads(json_string)
    except rapidjson.JSONDecodeError:
        log.exception("%s has a corrupted JSON", json_file_key)
        return {}


def parse_instructors(staff):
    """
    Parses staff/instructors users including their full name, salutation etc

    Args:
        array (dict): staff/instructors

    Returns:
        array (dict): parsed instructors
    """  # noqa: D401
    instructors = []
    for person in staff:
        instructor = {
            "first_name": person.get("given_name", person.get("first_name")),
            "last_name": person.get("family_name", person.get("last_name")),
            "full_name": person.get("title"),
        }

        if person.get("salutation"):
            if instructor.get("full_name") and (
                not instructor.get("full_name").startswith(person.get("salutation"))
            ):
                instructor["full_name"] = "{salutation} {full_name}".format(
                    salutation=person.get("salutation").strip(),
                    full_name=instructor.get("full_name"),
                )
            elif instructor.get("last_name"):
                instructor["full_name"] = "{salutation} {full_name}".format(
                    salutation=person.get("salutation").strip(),
                    full_name=" ".join(
                        [
                            part
                            for part in [
                                person.get("first_name"),
                                person.get("middle_initial"),
                                person.get("last_name"),
                            ]
                            if part
                        ]
                    ),
                )
        elif not instructor.get("full_name"):
            instructor["full_name"] = "{full_name}".format(
                full_name=" ".join(
                    [
                        part
                        for part in [
                            person.get("first_name"),
                            person.get("middle_initial"),
                            person.get("last_name"),
                        ]
                        if part
                    ]
                )
            )

        instructors.append(instructor)

    return instructors


def update_editor_group(user: User, is_editor: False):
    """Assign or unassign user to staff list editors group"""
    group, _ = Group.objects.get_or_create(name=GROUP_STAFF_LISTS_EDITORS)
    if is_editor:
        user.groups.add(group)
    else:
        user.groups.remove(group)


def get_ocw_topics(topics_collection):
    """
    Extracts OCW topics and subtopics and returns a unique list of them

    Args:
        topics_collection (dict): The JSON object representing the topic

    Returns:
        list of str: list of topics
    """  # noqa: D401
    topics = []

    for topic_object in topics_collection:
        if topic_object["ocw_feature"]:
            topics.append(topic_object["ocw_feature"])
        if topic_object["ocw_subfeature"]:
            topics.append(topic_object["ocw_subfeature"])
        if topic_object["ocw_speciality"]:
            topics.append(topic_object["ocw_speciality"])

    return list(set(topics))


def resource_upserted_actions(resource: LearningResource, percolate):
    """
    Trigger plugins when a LearningResource is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.resource_upserted(resource=resource, percolate=percolate)


def resource_unpublished_actions(resource: LearningResource):
    """
    Trigger plugins when a LearningResource is removed/unpublished
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.resource_unpublished(resource=resource)


def similar_topics_action(resource: LearningResource) -> dict:
    """
    Trigger plugin to get similar topics for a resource
    """
    pm = get_plugin_manager()
    hook = pm.hook
    topics = hook.resource_similar_topics(resource=resource)
    # The plugin returns the list wrapped in another list for some reason
    return topics[0] if topics else []


def resource_delete_actions(resource: LearningResource):
    """
    Trigger plugin to handle learning resource deletion
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.resource_before_delete(resource=resource)
    resource.delete()


def bulk_resources_unpublished_actions(resource_ids: list[int], resource_type: str):
    """
    Trigger plugins when a LearningResource is removed/unpublished
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.bulk_resources_unpublished(
        resource_ids=resource_ids, resource_type=resource_type
    )


def content_files_loaded_actions(run: LearningResourceRun, deindex_only):
    """
    Trigger plugins when content files are loaded for a LearningResourceRun
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.content_files_loaded(run=run, deindex_only=deindex_only)


def resource_run_unpublished_actions(run: LearningResourceRun):
    """
    Trigger plugins when a LearningResourceRun is removed/unpublished
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.resource_run_unpublished(run=run)


def resource_run_delete_actions(run: LearningResourceRun):
    """
    Trigger plugin to handle learning resource run deletion
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.resource_run_delete(run=run)


def topic_upserted_actions(topic: LearningResourceTopic, *, overwrite: bool = False):
    """
    Trigger plugins when a LearningResourceTopic is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.topic_upserted(topic=topic, overwrite=overwrite)


def topic_delete_actions(topic: LearningResourceTopic):
    """
    Trigger plugin function to delete a LearningResourceTopic
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.topic_delete(topic=topic)


def department_upserted_actions(
    department: LearningResourceDepartment, *, overwrite: bool = False
):
    """
    Trigger plugins when a LearningResourceDepartment is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.department_upserted(department=department, overwrite=overwrite)


def department_delete_actions(department: LearningResourceDepartment):
    """
    Trigger plugin function to delete a LearningResourceDepartment
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.department_delete(department=department)


def offeror_upserted_actions(
    offeror: LearningResourceOfferor, *, overwrite: bool = False
):
    """
    Trigger plugins when a LearningResourceOfferor is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.offeror_upserted(offeror=offeror, overwrite=overwrite)


def offeror_delete_actions(offeror: LearningResourceOfferor):
    """
    Trigger plugin function to delete a LearningResourceOfferor
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.offeror_delete(offeror=offeror)


def _walk_topic_map(topics: list, parent: None | LearningResourceTopic = None) -> None:
    """
    Walk the topic map provided and create topic records accordingly.

    This will recursively walk through the topics list and create/update topic
    records as appropriate. The topic records are stored in this format:
    - name - the name of the topic
    - id - the UUID for the topic
    - icon - the icon we should display for the topic (a Remixicon, generally)
    - mappings - mappings for topics found in offeror data
    - children - child topics (records in this same format)
    - parent - specific parent for the topic
    A more detailed definition of this is in data/README-topics.md.

    Args:
    - topics (list of dict): the topics to process
    - parent (None or LearningResourceTopic): the parent topic (for inner loops)
    Returns:
    - None
    """

    for topic in topics:
        defaults = {
            "parent": parent,
            "name": topic["name"],
            "icon": topic["icon"] or "",
        }

        if not parent and "parent" in topic:
            # Topic specifies a parent, so let's try to grab it.
            try:
                defaults["parent"] = LearningResourceTopic.objects.filter(
                    topic_uuid=topic["parent"]
                ).get()
            except LearningResourceTopic.DoesNotExist:
                log.warning(
                    (
                        "_walk_topic_map: topic %s specified a parent %s but"
                        " the parent did not exist"
                    ),
                    topic["name"],
                    topic["parent"],
                )

        if topic["id"]:
            defaults["topic_uuid"] = topic["id"]

        lr_topic, created = LearningResourceTopic.objects.filter(
            Q(name=topic["name"]) | Q(topic_uuid=topic["id"])
        ).update_or_create(defaults=defaults)

        log.debug("%s topic %s", "Created" if created else "Updated", lr_topic.name)

        LearningResourceTopicMapping.objects.filter(topic=lr_topic).all().delete()

        if topic["mappings"] and len(topic["mappings"]) > 0:
            for offeror_code in topic["mappings"]:
                offeror = LearningResourceOfferor.objects.filter(
                    code=offeror_code
                ).first()

                if offeror:
                    for mapping in topic["mappings"][offeror_code]:
                        log.debug(
                            "Created mapping for %s from %s to %s",
                            offeror_code,
                            mapping,
                            lr_topic.name,
                        )
                        LearningResourceTopicMapping.objects.create(
                            topic=lr_topic, offeror=offeror, topic_name=mapping
                        )

        topic_upserted_actions(lr_topic)

        if "children" in topic and topic["children"] and len(topic["children"]) > 0:
            _walk_topic_map(topic["children"], lr_topic)


def _walk_lr_topic_parents(
    learning_resource: LearningResource,
    topic: LearningResourceTopic,
) -> None:
    """Walk the topic list and add parents as necessary."""

    learning_resource.topics.add(topic)

    if topic.parent:
        _walk_lr_topic_parents(learning_resource, topic.parent)


@transaction.atomic()
def add_parent_topics_to_learning_resource(resource):
    """Add the parent topics to the learning resource"""

    for topic in resource.topics.all():
        if topic.parent:
            _walk_lr_topic_parents(resource, topic.parent)


def transfer_list_resources(
    resource_type: str,
    matching_field: str,
    from_source: str,
    to_source: str,
    *,
    delete_unpublished: bool = False,
) -> tuple[int, int]:
    """
    Migrate unpublished learningpath/userlist resources that have
    been replaced with new resource objects.

    Args:
        resource_type (str): the resource type
        matching_field (str): the unique field to match identical resources
        from_source (str): the ETL source of unpublished resources
        to_source (str): the ETL source of published resources
        delete_unpublished (bool): whether to delete the unpublished resources

    Returns:
        tuple[int, int]: the number of unpublished and matching published resources
    """
    unpublished_resources = LearningResource.objects.filter(
        resource_type=resource_type, published=False, etl_source=from_source
    )
    unpublished_count = 0
    published_count = 0
    for resource in unpublished_resources:
        unpublished_count += 1
        unique_value = getattr(resource, matching_field)
        published_replacement = LearningResource.objects.filter(
            **{matching_field: unique_value},
            resource_type=resource_type,
            published=True,
            etl_source=to_source,
        ).first()
        if published_replacement is not None:
            published_count += 1
            LearningResourceRelationship.objects.filter(
                relation_type=LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value,
                child=resource,
            ).update(child=published_replacement)
            UserListRelationship.objects.filter(child=resource).update(
                child=published_replacement
            )
    if delete_unpublished:
        unpublished_resources.delete()
    return unpublished_count, published_count


def dump_topics_to_yaml(topic_id: int | None = None):
    """
    Dump the topic data to a yaml file.

    Args:
    * topic_id (int or None): the topic to dump, or None for all.
    Returns:
    * str: the yaml document
    """

    def _dump_subtopic_to_yaml(topic: LearningResourceTopic):
        """Dump subtopic data to yaml recursively."""

        yaml_ready_data = {
            "id": str(topic.topic_uuid),
            "name": topic.name,
            "icon": topic.icon,
            "mappings": {},
            "children": [],
            "parent": str(topic.parent.topic_uuid) if topic.parent else None,
        }

        for mapping in LearningResourceTopicMapping.objects.filter(topic=topic).all():
            if mapping.offeror.code not in yaml_ready_data["mappings"]:
                yaml_ready_data["mappings"][mapping.offeror.code] = []

            yaml_ready_data["mappings"][mapping.offeror.code].append(mapping.topic_name)

        for child in LearningResourceTopic.objects.filter(parent=topic).all():
            yaml_ready_data["children"].append(_dump_subtopic_to_yaml(child))

        return yaml_ready_data

    if topic_id:
        parent_topics = [LearningResourceTopic.objects.get(pk=topic_id)]
    else:
        parent_topics = LearningResourceTopic.objects.filter(parent__isnull=True).all()

    root_level_topics = {
        "topics": [_dump_subtopic_to_yaml(topic) for topic in parent_topics]
    }

    return yaml.dump(root_level_topics)
