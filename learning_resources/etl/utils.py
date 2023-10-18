"""Helper functions for ETL"""

import csv
import glob
import logging
import mimetypes
import os
import re
import uuid
from collections.abc import Generator
from datetime import datetime
from hashlib import md5
from itertools import chain
from pathlib import Path
from subprocess import check_call
from tempfile import TemporaryDirectory

import boto3
import pytz
import rapidjson
import requests
from django.conf import settings
from django.utils.functional import SimpleLazyObject
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
)
from learning_resources.etl.constants import ETLSource
from learning_resources.models import ContentFile, LearningResourceRun

log = logging.getLogger(__name__)


def _load_ucc_topic_mappings():
    """# noqa: D401
    Loads the topic mappings from the crosswalk CSV file

    Returns:
        dict:
            the mapping dictionary
    """
    with Path.open(
        Path("learning_resources/data/ucc-topic-mappings.csv")
    ) as mapping_file:
        rows = list(csv.reader(mapping_file))
        # drop the column headers (first row)
        rows = rows[1:]
        mapping = {}
        for row in rows:
            ocw_topics = list(filter(lambda item: item, row[2:]))
            mapping[f"{row[0]}:{row[1]}"] = ocw_topics
            mapping[row[1]] = ocw_topics
        return mapping


UCC_TOPIC_MAPPINGS = SimpleLazyObject(_load_ucc_topic_mappings)


def transform_topics(topics):
    """
    Transform topics by using our crosswalk mapping

    Args:
        topics (list of dict):
            the topics to transform

    Return:
        list of dict: the transformed topics
    """
    return [
        {"name": topic_name}
        for topic_name in chain.from_iterable(
            [
                UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                for topic in topics
                if topic is not None
            ]
        )
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
    if settings.TIKA_ACCESS_TOKEN:
        headers["X-Access-Token"] = settings.TIKA_ACCESS_TOKEN
    request_options = {"headers": headers} if headers else {}
    request_options["timeout"] = settings.TIKA_TIMEOUT

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
        ).replace(hour=hour, tzinfo=pytz.utc)
        end_date = datetime.strptime(
            f"{match.group('start_m')} {match.group('end_d')} {match.group('year')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=pytz.utc)
        return start_date, end_date
    match = re.match(pattern_1_year, date_string)
    if match:
        start_date = datetime.strptime(
            f"{match.group('start_m')} {match.group('start_d')} {match.group('year')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=pytz.utc)
        end_date = datetime.strptime(
            f"{match.group('end_m')} {match.group('end_d')} {match.group('year')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=pytz.utc)
        return start_date, end_date
    match = re.match(pattern_2_years, date_string)
    if match:
        start_date = datetime.strptime(
            f"{match.group('start_m')} {match.group('start_d')} {match.group('start_y')}",  # noqa: E501
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=pytz.utc)
        end_date = datetime.strptime(
            f"{match.group('end_m')} {match.group('end_d')} {match.group('end_y')}",
            "%b %d %Y",
        ).replace(hour=hour, tzinfo=pytz.utc)
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
        ETLSource.mit_edx.value: settings.EDX_LEARNING_COURSE_BUCKET_NAME,
        ETLSource.xpro.value: settings.XPRO_LEARNING_COURSE_BUCKET_NAME,
        ETLSource.mitxonline.value: settings.MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME,
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
    hash_md5 = md5()  # noqa: S324
    with Path.open(Path(filename), "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


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


def extract_valid_department_from_id(course_string: str) -> list[str]:
    """
    Extracts a department from course data and returns

    Args:
        course_string (str): course name as string

    Returns:
        department (str): parsed department string
    """  # noqa: D401
    department_string = re.search(r"\+([^\.]*)\.", course_string)
    if department_string:
        dept_candidate = department_string.groups()[0]
        return [dept_candidate] if dept_candidate in DEPARTMENTS else []
    return []
