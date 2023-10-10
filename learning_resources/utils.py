"""Utils for learning resources"""
import logging
import re
from datetime import datetime

import pytz
import rapidjson
import requests
import yaml
from botocore.exceptions import ClientError
from django.conf import settings
from django.contrib.auth.models import Group, User
from retry import retry

from learning_resources.constants import (
    GROUP_STAFF_LISTS_EDITORS,
    semester_mapping,
)
from open_discussions.utils import generate_filepath

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
        else:
            semester = None
            year = course_run.get("start")[:4] if course_run.get("start") else None
    return year, semester


def semester_year_to_date(semester, year, ending=False):  # noqa: FBT002
    """
    Convert semester and year to a rough date

    Args:
        semester (str): Semester ("Fall", "Spring", etc)
        year (int): Year
        ending (boolean): True for end of semester, False for beginning

    Returns:
        datetime: The rough date of the course
    """
    if semester is None or year is None:
        return None
    if semester.lower() == "fall":
        month_day = "12-31" if ending else "09-01"
    elif semester.lower() == "summer":
        month_day = "08-30" if ending else "06-01"
    elif semester.lower() == "spring":
        month_day = "05-31" if ending else "01-01"
    elif semester.lower() == "january iap":
        month_day = "01-31" if ending else "01-01"
    else:
        return None
    return datetime.strptime(f"{year}-{month_day}", "%Y-%m-%d").replace(tzinfo=pytz.UTC)


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
