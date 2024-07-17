"""Helper functions for ETL"""

import glob
import logging
import mimetypes
import os
import re
import tarfile
import uuid
from collections import Counter
from collections.abc import Generator
from datetime import UTC, datetime
from hashlib import md5
from itertools import chain
from pathlib import Path
from subprocess import check_call
from tempfile import TemporaryDirectory

import boto3
import rapidjson
import requests
from django.conf import settings
from django.utils.text import slugify
from tika import parser as tika_parser
from xbundle import XBundle

from learning_resources.constants import (
    CONTENT_TYPE_FILE,
    CONTENT_TYPE_PDF,
    CONTENT_TYPE_VERTICAL,
    CONTENT_TYPE_VIDEO,
    DEPARTMENTS,
    VALID_TEXT_FILE_TYPES,
    AvailabilityType,
    LearningResourceFormat,
    LevelType,
    OfferedBy,
)
from learning_resources.etl.constants import (
    RESOURCE_FORMAT_MAPPING,
    CourseNumberType,
    ETLSource,
)
from learning_resources.models import (
    ContentFile,
    Course,
    LearningResource,
    LearningResourceRun,
    LearningResourceTopicMapping,
)

log = logging.getLogger(__name__)


def load_offeror_topic_map(offeror_code: str):
    """
    Load the topic mappings from the database.

    Returns:
    - dict, the mapping dictionary
    """

    pmt_mappings = (
        LearningResourceTopicMapping.objects.filter(offeror__code=offeror_code)
        .prefetch_related("topic")
        .all()
    )

    mappings = {}

    for pmt_mapping in pmt_mappings:
        mappings[pmt_mapping.topic.name] = pmt_mapping.topic_name
        mappings[pmt_mapping.topic.full_name] = pmt_mapping.topic_name

    return mappings


def transform_topics(topics: list, offeror_code: str):
    """
    Transform topics by using our crosswalk mapping

    Args:
        topics (list of dict):
            the topics to transform

    Return:
        list of dict: the transformed topics
    """
    topic_mappings = load_offeror_topic_map(offeror_code)

    return [
        {"name": topic_name}
        for topic_name in chain.from_iterable(
            [
                topic_mappings.get(topic["name"], [topic["name"]])
                for topic in topics
                if topic is not None
            ]
        )
    ]


def without_none(values) -> list:
    """Remove all occurrences of None from a list."""
    return [x for x in values if x is not None]


def transform_levels(level_labels: list[str]) -> list[LevelType]:
    """
    Given list of level labels, return list of keys.

    >>> transform_levels(["High School", "Undergraduate"])
    ["high_school", "undergraduate"]
    """
    return [
        LevelType(label).name for label in level_labels if label in LevelType.values()
    ]


def _infinite_counter():
    """Infinite counter"""
    count = 0
    while True:
        yield count
        count += 1


def sync_s3_text(bucket, key, content_meta):
    """
    Save the extracted text for a ContentFile to S3 for future use

    Args:
        bucket(s3.Bucket): the bucket to place data in
        key(str): the original key of the content file
        content_meta(dict): the content metadata returned by tika
    """
    if bucket and content_meta:
        bucket.put_object(
            Key=f"extracts/{key}.json",
            Body=rapidjson.dumps(content_meta),
            ACL="public-read",
        )


def extract_text_metadata(data, *, other_headers=None):
    """
    Use tika to extract text content from file data

    Args:
        data (str): File contents
        other_headers (dict): Optional other headers to send to tika

    Returns:
         dict: metadata returned by tika, including content

    """
    if not data:
        return None

    headers = {**other_headers} if other_headers else {}
    if settings.TIKA_OCR_STRATEGY:
        headers["X-Tika-PDFOcrStrategy"] = settings.TIKA_OCR_STRATEGY
    if settings.TIKA_ACCESS_TOKEN:
        headers["X-Access-Token"] = settings.TIKA_ACCESS_TOKEN

    request_options = {
        "timeout": settings.TIKA_TIMEOUT,
        "verify": True,
        "headers": headers,
    }

    return tika_parser.from_buffer(data, requestOptions=request_options)


def extract_text_from_url(url, *, mime_type=None):
    """
    Retrieve data from a URL and parse it with tika

    Args:
        url(str): The URL to retrieve content from
        mime_type(str): The expected mime-type of the content

    Returns:
        str: The text contained in the URL content.
    """
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    if response.content:
        return extract_text_metadata(
            response.content,
            other_headers={"Content-Type": mime_type} if mime_type else {},
        )
    return None


def generate_readable_id(text):
    """
    Generate a unique id based on a string

    Args:
        text(str): The string to base the id on

    Returns:
        str: The unique id

    """
    return f"{slugify(text)}{uuid.uuid3(uuid.NAMESPACE_URL, text).hex}"


def get_max_contentfile_length(field):
    """
    Get the max length of a ContentFile field

    Args:
        field (str): the name of the field

    Returns:
        int: the max_length of the field
    """
    return ContentFile._meta.get_field(field).max_length  # noqa:SLF001


def strip_extra_whitespace(text):
    """
    Remove extra whitespace from text

    Args:
        text: string to strip extra whitespace from

    Returns:
        str: text without extra whitespace

    """
    return re.sub(r"[\s]{2,}", " ", text).strip()


def parse_dates(date_string, hour=12):
    """
    Extract a pair of dates from a string

    Args:
        date_string(str): A string containing start and end dates
        hour(int): Default hour of the day

    Returns:
        tuple of datetime: Start and end datetimes
    """
    # Start and end dates in same month (Jun 18-19, 2020)
    pattern_1_month = re.compile(
        r"(?P<start_m>\w+)\s+(?P<start_d>\d+)\s*-\s*(?P<end_d>\d+)?,\s*(?P<year>\d{4})$"
    )
    # Start and end dates in different months, same year (Jun 18 - Jul 18, 2020)
    pattern_1_year = re.compile(
        r"(?P<start_m>\w+)\s+(?P<start_d>\d+)\s*\-\s*(?P<end_m>\w+)\s+(?P<end_d>\d+),\s*(?P<year>\d{4})$"
    )
    # Start and end dates in different years (Dec 21, 2020-Jan 10,2021)
    pattern_2_years = re.compile(
        r"(?P<start_m>\w+)\s+(?P<start_d>\d+),\s*(?P<start_y>\d{4})\s*-\s*(?P<end_m>\w+)\s+(?P<end_d>\d+),\s*(?P<end_y>\d{4})$"
    )

    match = re.match(pattern_1_month, date_string)
    if match:
        start_date = datetime.strptime(
            f"{match.group('start_m')} {match.group('start_d')} {match.group('year')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=UTC)
        end_date = datetime.strptime(
            f"{match.group('start_m')} {match.group('end_d')} {match.group('year')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=UTC)
        return start_date, end_date
    match = re.match(pattern_1_year, date_string)
    if match:
        start_date = datetime.strptime(
            f"{match.group('start_m')} {match.group('start_d')} {match.group('year')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=UTC)
        end_date = datetime.strptime(
            f"{match.group('end_m')} {match.group('end_d')} {match.group('year')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=UTC)
        return start_date, end_date
    match = re.match(pattern_2_years, date_string)
    if match:
        start_date = datetime.strptime(
            f"{match.group('start_m')} {match.group('start_d')} {match.group('start_y')}",  # noqa: E501
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=UTC)
        end_date = datetime.strptime(
            f"{match.group('end_m')} {match.group('end_d')} {match.group('end_y')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=UTC)
        return start_date, end_date
    return None


def _get_text_from_element(element, content):
    """
    Recurse through XML elements

    Args:
        element (Element): An XML element
        content (list): A list of strings, to be modified with any new material
    """
    if element.tag not in ("style", "script"):
        if element.text:
            content.append(element.text)

        for child in element.getchildren():
            _get_text_from_element(child, content)

        if element.tail:
            content.append(element.tail)


def get_text_from_element(element):
    """
    Get relevant text for ingestion from XML element

    Args:
        element (Element): A XML element representing a vertical
    """
    content = []
    _get_text_from_element(element, content)
    return " ".join(content)


def get_xbundle_docs(olx_path: str) -> Generator[dict, None, None]:
    """
    Get vertical documents from an edx tar archive

    Args:
        olx_path(str): path to extracted edx tar archive

    Yields:
        tuple: A list of (bytes of content, metadata)
    """
    bundle = XBundle()
    bundle.import_from_directory(olx_path)
    for index, vertical in enumerate(bundle.course.findall(".//vertical")):
        content = get_text_from_element(vertical)
        yield (
            content,
            {
                "key": f"vertical_{index + 1}",
                "content_type": CONTENT_TYPE_VERTICAL,
                "title": vertical.attrib.get("display_name") or "",
                "mime_type": "application/xml",
                "checksum": md5(content.encode("utf-8")).hexdigest(),  # noqa: S324
            },
        )


def documents_from_olx(
    olx_path: str,
) -> Generator[tuple, None, None]:
    """
    Extract text from OLX directory

    Args:
        olx_path (str): The path to the directory with the OLX data

    Yields:
        tuple: A list of (bytes of content, metadata)
    """
    try:
        yield from get_xbundle_docs(olx_path)
    except:  # noqa: E722
        log.exception("Could not read verticals from path %s", olx_path)

    counter = _infinite_counter()

    for root, _, files in os.walk(olx_path):
        for filename in files:
            extension_lower = Path(filename).suffix.lower()
            if extension_lower in VALID_TEXT_FILE_TYPES:
                with Path.open(Path(root, filename), "rb") as f:
                    filebytes = f.read()

                mimetype = mimetypes.types_map.get(extension_lower)

                yield (
                    filebytes,
                    {
                        "key": f"document_{next(counter)}_{filename}",
                        "content_type": CONTENT_TYPE_FILE,
                        "mime_type": mimetype,
                        "checksum": md5(filebytes).hexdigest(),  # noqa: S324
                    },
                )


def transform_content_files(
    course_tarpath: Path, run: LearningResourceRun
) -> Generator[dict, None, None]:
    """
    Pass content to tika, then return JSON document with transformed content inside it

    Args:
        course_tarpath (str): The path to the tarball which contains the OLX
        run (LearningResourceRun): The run associated witb the content files

    Yields:
        dict: content from file
    """
    basedir = course_tarpath.name.split(".")[0]
    with TemporaryDirectory(prefix=basedir) as inner_tempdir:
        check_call(["tar", "xf", course_tarpath], cwd=inner_tempdir)  # noqa: S603,S607
        olx_path = glob.glob(inner_tempdir + "/*")[0]  # noqa: PTH207
        for document, metadata in documents_from_olx(olx_path):
            key = metadata["key"]
            content_type = metadata["content_type"]
            mime_type = metadata.get("mime_type")

            existing_content = ContentFile.objects.filter(key=key, run=run).first()
            if not existing_content or existing_content.checksum != metadata.get(
                "checksum"
            ):
                tika_output = extract_text_metadata(
                    document,
                    other_headers={"Content-Type": mime_type} if mime_type else {},
                )

                if tika_output is None:
                    log.info("No tika response for %s", key)
                    continue

                tika_content = tika_output.get("content") or ""
                tika_metadata = tika_output.get("metadata") or {}
                content_dict = {
                    "content": tika_content.strip(),
                    "content_title": (
                        metadata.get("title") or tika_metadata.get("title") or ""
                    )[: get_max_contentfile_length("content_title")],
                    "content_author": (tika_metadata.get("Author") or "")[
                        : get_max_contentfile_length("content_author")
                    ],
                    "content_language": (tika_metadata.get("language") or "")[
                        : get_max_contentfile_length("content_language")
                    ],
                }
            else:
                content_dict = {
                    "content": existing_content.content,
                    "content_title": existing_content.content_title,
                    "content_author": existing_content.content_author,
                    "content_language": existing_content.content_language,
                }
            yield (
                {
                    "key": key,
                    "published": True,
                    "content_type": content_type,
                    "checksum": metadata.get("checksum"),
                    **content_dict,
                }
            )


def get_learning_course_bucket_name(etl_source: str) -> str:
    """
    Get the name of the platform's edx content bucket

    Args:
        etl_source(str): The ETL source that determines which bucket to use

    Returns:
        str: The name of the edx archive bucket for the platform
    """
    bucket_names = {
        ETLSource.mit_edx.name: settings.EDX_LEARNING_COURSE_BUCKET_NAME,
        ETLSource.xpro.name: settings.XPRO_LEARNING_COURSE_BUCKET_NAME,
        ETLSource.mitxonline.name: settings.MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME,
        ETLSource.oll.name: settings.OLL_LEARNING_COURSE_BUCKET_NAME,
    }
    return bucket_names.get(etl_source)


def get_learning_course_bucket(etl_source: str) -> object:
    """
    Get the ETLSource-specific learning course S3 Bucket holding content file data

    Args:
        etl_source(str): The ETL source of the course data

    Returns:
        boto3.Bucket: the OCW S3 Bucket or None
    """
    bucket_name = get_learning_course_bucket_name(etl_source)
    if bucket_name:
        s3 = boto3.resource(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        return s3.Bucket(bucket_name)
    return None


def calc_checksum(filename) -> str:
    """
    Return the md5 checksum of the specified filepath

    Args:
        filename(str): The path to the file to checksum
    Returns:
        str: The md5 checksum of the file
    """
    with tarfile.open(filename, "r") as tgz_file:
        return str(hash(tuple(ti.chksum for ti in tgz_file.getmembers())))


def get_content_type(file_type: str) -> str:
    """
    Return the appropriate content type for a file type
    TODO: add more content types (text? spreadsheet?)

    Args:
        file_type (str): The file type

    Returns:
        str: The content type
    """
    if not file_type:
        return CONTENT_TYPE_FILE
    if file_type.startswith("video/"):
        return CONTENT_TYPE_VIDEO
    if file_type == "application/pdf":
        return CONTENT_TYPE_PDF
    return CONTENT_TYPE_FILE


def extract_valid_department_from_id(
    course_string: str,
    is_ocw: bool = False,  # noqa: FBT001, FBT002
) -> list[str]:
    """
    Extracts a department from course data and returns

    Args:
        course_string (str): course name as string

    Returns:
        department (str): parsed department string
    """  # noqa: D401
    num_pattern = r"^([0-9A-Za-z\-]+)\.*" if is_ocw else r"\+([^\.]*)\."
    department_string = re.search(num_pattern, course_string)
    if department_string:
        dept_candidate = department_string.groups()[0]
        # Some CMS-W department courses start with 21W, but we want to use CMS-W
        if dept_candidate == "21W":
            dept_candidate = "CMS-W"
        return [dept_candidate] if dept_candidate in DEPARTMENTS else []
    return []


def generate_course_numbers_json(
    course_num: str,
    extra_nums: list[str] | None = None,
    is_ocw: bool = False,  # noqa: FBT001, FBT002
) -> list[dict]:
    """
    Generate a dict containing info on course numbers and departments

    Args:
        course_num (str): primary course number
        extra_nums (list[str]): list of cross-listed course numbers
        is_ocw (bool): whether or not the course is an OCW course

    Returns:
        course_number_json (list[dict]): list of dicts containing course number info

    """
    course_number_json = []
    course_numbers = [course_num]
    if not extra_nums:
        extra_nums = []
    course_numbers.extend(extra_nums)
    for idx, num in enumerate(course_numbers):
        dept_id = extract_valid_department_from_id(num, is_ocw=is_ocw)
        if (
            dept_id
            and dept_id[0].isdigit()
            and len(dept_id[0]) == 1
            and num.startswith(dept_id[0])
        ):
            sort_coursenum = f"0{num}"
        else:
            sort_coursenum = num
        course_number_json.append(
            {
                "value": num,
                "listing_type": (
                    CourseNumberType.primary.value
                    if idx == 0
                    else CourseNumberType.cross_listed.value
                ),
                "department": (
                    {
                        "department_id": dept_id[0],
                        "name": DEPARTMENTS[dept_id[0]],
                    }
                    if dept_id
                    else None
                ),
                "sort_coursenum": sort_coursenum,
                "primary": idx == 0,
            }
        )
    return course_number_json


def update_course_numbers_json(course: Course):
    """
    Update the course_numbers JSON for a Course

    Args:
        course (Course): The Course to update
    """
    is_ocw = course.learning_resource.etl_source == ETLSource.ocw.name
    extra_nums = [
        num["value"]
        for num in course.course_numbers
        if num["listing_type"] == CourseNumberType.cross_listed.value
    ]
    course.course_numbers = generate_course_numbers_json(
        (
            course.learning_resource.readable_id.split("+")[0]
            if is_ocw
            else course.learning_resource.readable_id
        ),
        extra_nums=extra_nums,
        is_ocw=is_ocw,
    )
    course.save()


def most_common_topics(
    resources: list[LearningResource], max_topics: int = settings.OPEN_VIDEO_MAX_TOPICS
) -> list[dict]:
    """
    Get the most common topics from a list of resources

    Args:
        resources (list[LearningResource]): resources to get topics from
        max_topics (int): The maximum number of topics to return

    Returns:
        list of dict: The most common topic names
    """
    counter = Counter(
        [topic.name for resource in resources for topic in resource.topics.all()]
    )
    common_topics = dict(counter.most_common(max_topics)).keys()
    return [{"name": topic} for topic in common_topics]


def transform_format(resource_format: str) -> list[str]:
    """
    Return the correct format of the resource

    Args:
        document: course or program data

    Returns:
        str: format of the course/program

    """
    try:
        return [RESOURCE_FORMAT_MAPPING[resource_format]]
    except KeyError:
        log.exception("Invalid format %s", resource_format)
        return [LearningResourceFormat.online.name]


def parse_certification(offeror, runs_data):
    """Return true/false depending on offeror and run availability"""
    if offeror != OfferedBy.mitx.name:
        return False
    return bool(
        [
            availability
            for availability in [
                run.get("availability")
                for run in runs_data
                if run.get("published", True)
            ]
            if (availability and availability != AvailabilityType.archived.value)
        ]
    )
