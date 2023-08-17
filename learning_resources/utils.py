""" Utils for course catalog """
import logging
import re
from datetime import datetime
from urllib.parse import urljoin

import pytz
import rapidjson
import requests
import yaml
from django.conf import settings

from learning_resources.constants import (
    PlatformType,
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


# NOTE: this is unused, but a migration references it, so we'll leave it until we decide to squash migrations or something
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

    """
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
            if course_run.get("start"):
                year = course_run.get("start")[:4]
            else:
                year = None
    return year, semester


def get_course_url(course_id, course_json, platform):
    """
    Get the url for a course if any

    Args:
        course_id (str): The course_id of the course
        course_json (dict): The raw json for the course
        platform (str): The platform (mitx or ocw)

    Returns:
        str: The url for the course if any
    """
    if platform == PlatformType.ocw.value:
        if course_json is not None:
            urlpath = course_json.get("url")
            if urlpath:
                return urljoin(settings.OCW_BASE_URL, urlpath)
    elif platform == PlatformType.mitx.value:
        if course_json is not None:
            preferred_urls = []
            for run in course_json.get("course_runs", []):
                url = run.get("marketing_url", "")
                if url and settings.MITX_BASE_URL in url:
                    preferred_urls.append(url)
            if preferred_urls:
                return preferred_urls[0].split("?")[0]
        return "{}{}/course/".format(settings.MITX_ALT_URL, course_id)
    return None


def semester_year_to_date(semester, year, ending=False):
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
        return
    if semester.lower() == "fall":
        month_day = "12-31" if ending else "09-01"
    elif semester.lower() == "summer":
        month_day = "08-30" if ending else "06-01"
    elif semester.lower() == "spring":
        month_day = "05-31" if ending else "01-01"
    elif semester.lower() == "january iap":
        month_day = "01-31" if ending else "01-01"
    else:
        return
    return datetime.strptime("{}-{}".format(year, month_day), "%Y-%m-%d").replace(
        tzinfo=pytz.UTC
    )


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


def load_course_duplicates(platform):
    """
    Get a list of blocklisted course ids for a platform
    Args:
        platform (string): the platform for which course duplicates are needed
    Returns:
        list of lists of courses which are duplicates of each other
    """
    duplicates_url = settings.DUPLICATE_COURSES_URL
    if duplicates_url is not None:
        response = requests.get(duplicates_url, timeout=settings.REQUESTS_TIMEOUT)
        response.raise_for_status()
        duplicates_for_all_platforms = yaml.safe_load(response.text)
        if platform in duplicates_for_all_platforms:
            return duplicates_for_all_platforms[platform]
    return []


def get_s3_object_and_read(obj, iteration=0):
    """
    Attempts to read S3 data, and tries again up to MAX_S3_GET_ITERATIONS if it encounters an error.
    This helps to prevent read timeout errors from stopping sync.

    Args:
        obj (s3.ObjectSummary): The S3 ObjectSummary we are trying to read
        iteration (int): A number tracking how many times this function has been run

    Returns:
        bytes: The contents of a json file read from S3
    """
    try:
        return obj.get()["Body"].read()
    except Exception:  # pylint: disable=broad-except
        if iteration < settings.MAX_S3_GET_ITERATIONS:
            return get_s3_object_and_read(obj, iteration + 1)
        else:
            raise


def safe_load_json(json_string, json_file_key):
    """
    Loads the passed string as a JSON object with exception handing and logging.
    Some OCW JSON content may be malformed.

    Args:
        json_string (str): The JSON contents as a string
        json_file_key (str or bytes): file ID for the JSON file

    Returns:
        JSON (dict): the JSON contents as JSON
    """
    try:
        loaded_json = rapidjson.loads(json_string)
        return loaded_json
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
    """
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
