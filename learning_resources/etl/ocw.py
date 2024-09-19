"""OCW Next Resource ETL"""

import copy
import logging
import mimetypes
from datetime import datetime
from json import JSONDecodeError
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from django.utils.text import slugify
from requests import ReadTimeout
from retry import retry

from learning_resources.constants import (
    CONTENT_TYPE_PAGE,
    CONTENT_TYPE_VIDEO,
    VALID_TEXT_FILE_TYPES,
    Availability,
    LearningResourceDelivery,
    LearningResourceType,
    OfferedBy,
    PlatformType,
    RunStatus,
)
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.utils import (
    extract_text_metadata,
    generate_course_numbers_json,
    get_content_type,
    transform_levels,
    transform_topics,
)
from learning_resources.models import (
    ContentFile,
    LearningResource,
    default_delivery,
)
from learning_resources.utils import (
    get_s3_object_and_read,
    parse_instructors,
    safe_load_json,
)
from main.utils import clean_data

log = logging.getLogger(__name__)

OFFERED_BY = {"code": OfferedBy.ocw.name}
PRIMARY_COURSE_ID = "primary_course_number"
UNIQUE_FIELD = "url"


def parse_delivery(course_data: dict) -> list[str]:
    """
    Parse delivery methods

    Args:
        url (str): The course url

    Returns:
        list[str]: The delivery method(s)
    """
    delivery = default_delivery()
    if settings.OCW_OFFLINE_DELIVERY and not course_data.get("hide_download"):
        delivery.append(LearningResourceDelivery.offline.name)
    return delivery


def transform_content_files(
    s3_resource: boto3.resource,
    course_prefix: str,
    force_overwrite: bool,  # noqa: FBT001
) -> dict:
    """
    Transform page and resource data from the s3 bucket into content_file data

    Args:
        s3_resource (boto3.resource): The S3 resource
        course_prefix (str):String used to query S3 bucket for course data JSONs
        force_overwrite (bool): Overwrite document text if true

    Yields:
        dict: transformed content file data

    """
    bucket = s3_resource.Bucket(name=settings.OCW_LIVE_BUCKET)

    for obj in bucket.objects.filter(Prefix=course_prefix + "pages/"):
        if obj.key.endswith("data.json"):
            try:
                course_page_json = safe_load_json(get_s3_object_and_read(obj), obj.key)
                yield transform_page(obj.key, course_page_json)

            except:  # noqa: E722
                log.exception(
                    "ERROR syncing course file %s for course %s", obj.key, course_prefix
                )

    for obj in bucket.objects.filter(Prefix=course_prefix + "resources/"):
        if obj.key.endswith("data.json"):
            try:
                resource_json = safe_load_json(get_s3_object_and_read(obj), obj.key)
                transformed_resource = transform_contentfile(
                    obj.key, resource_json, s3_resource, force_overwrite
                )
                if transformed_resource:
                    yield transformed_resource

            except:  # noqa: E722
                log.exception(
                    "ERROR syncing course file %s for course %s", obj.key, course_prefix
                )


def transform_page(s3_key: str, page_data: dict) -> dict:
    """
    Transform the data from data.json for a page into content_file data

    Args:
        s3_key (str):S3 path for the data.json file for the page
        page_data (dict): JSON data from the data.json file for the page

    Returns:
        dict: transformed content file data

    """

    s3_path = s3_key.split("data.json")[0]
    return {
        "content_type": CONTENT_TYPE_PAGE,
        "url": urljoin(settings.OCW_BASE_URL, urlparse(s3_path).path.lstrip("/")),
        "title": page_data.get("title"),
        "content_title": page_data.get("title"),
        "content": page_data.get("content"),
        "key": s3_path,
        "published": True,
    }


@retry((ReadTimeout, JSONDecodeError), tries=3, delay=1, backoff=2, jitter=(1, 5))
def get_file_content(
    s3_path: str,
    file_s3_path: str,
    s3_resource: boto3.resource,
    force_overwrite: bool,  # noqa: FBT001
) -> dict:
    """
    Return the text content of the file if it is a valid text file

    Args:
        s3_path (str): S3 path for the data.json file for the page
        file_s3_path (str): S3 path for the file
        s3_resource (boto3.resource): The S3 resource
        force_overwrite (bool): Overwrite document text if true
    """
    ext_lower = Path(file_s3_path).suffix.lower()
    mime_type = mimetypes.types_map.get(file_s3_path)
    content_json = None

    if ext_lower in VALID_TEXT_FILE_TYPES:
        s3_obj = s3_resource.Object(
            settings.OCW_LIVE_BUCKET, unquote(file_s3_path)
        ).get()

        course_file_obj = ContentFile.objects.filter(key=s3_path).first()

        needs_text_update = (
            force_overwrite
            or course_file_obj is None
            or (
                s3_obj is not None
                and s3_obj["LastModified"] >= course_file_obj.updated_on
            )
        )

        if needs_text_update:
            try:
                s3_body = s3_obj["Body"].read() if s3_obj else None
                if s3_body:
                    content_json = extract_text_metadata(
                        s3_body,
                        other_headers={"Content-Type": mime_type} if mime_type else {},
                    )
            except (ClientError, ReadTimeout, JSONDecodeError):
                log.exception("Could not parse text for %s", file_s3_path)
        return content_json
    return None


def transform_contentfile(
    s3_key: str,
    contentfile_data: dict,
    s3_resource: boto3.resource,
    force_overwrite: bool,  # noqa: FBT001
) -> dict:
    """
    Transform the data from data.json for a content file

    Args:
        s3_key (str):S3 path for the data.json file for the page
        contentfile_data (dict): JSON data from the data.json file for the page
        s3_resource (str): The S3 file
        force_overwrite (bool): Overwrite document text if true


    Returns:
        dict: transformed content file data

    """
    s3_path = s3_key.split("data.json")[0]
    s3_path = urlparse(s3_path).path.lstrip("/")

    file_type = contentfile_data.get("file_type")
    if contentfile_data.get("resource_type") == "Video":
        content_type = CONTENT_TYPE_VIDEO
        file_s3_path = contentfile_data.get("transcript_file")
        image_src = contentfile_data.get("thumbnail_file")
    else:
        content_type = get_content_type(file_type)
        file_s3_path = contentfile_data.get("file")
        image_src = None

    title = contentfile_data.get("title")

    if title in ("3play caption file", "3play pdf file") or not file_s3_path:
        return None

    contentfile_data = {
        "description": contentfile_data.get("description"),
        "file_type": file_type,
        "content_type": content_type,
        "url": urljoin(settings.OCW_BASE_URL, urlparse(s3_path).path.lstrip("/")),
        "title": title,
        "content_title": title,
        "key": s3_path,
        "content_tags": contentfile_data.get("learning_resource_types"),
        "published": True,
    }

    if not file_s3_path.startswith("courses"):
        file_s3_path = "courses" + file_s3_path.split("courses")[1]

    content_json = get_file_content(s3_path, file_s3_path, s3_resource, force_overwrite)
    if content_json:
        contentfile_data["content"] = content_json.get("content")

    if image_src:
        contentfile_data["image_src"] = image_src

    return contentfile_data


def transform_run(course_data: dict) -> dict:
    """Convert ocw course data into a dict for a run"""
    image_src = course_data.get("image_src")
    semester = course_data.get("term") or None
    year = course_data.get("year") or None

    return {
        "run_id": course_data["run_id"],
        "published": True,
        "instructors": parse_instructors(course_data.get("instructors", [])),
        "description": clean_data(course_data.get("course_description_html")),
        "year": year,
        "semester": semester,
        "status": RunStatus.current.value,
        "image": {
            "url": urljoin(settings.OCW_BASE_URL, image_src) if image_src else None,
            "description": course_data.get("course_image_metadata", {}).get(
                "description"
            ),
            "alt": (
                course_data.get("course_image_metadata", {})
                .get("image_metadata", {})
                .get("image-alt")
            ),
        },
        "level": transform_levels(course_data.get("level", [])),
        "last_modified": course_data.get("last_modified"),
        "title": course_data.get("course_title"),
        "slug": course_data.get("slug"),
        "url": course_data["url"],
        "availability": Availability.anytime.name,
        "delivery": parse_delivery(course_data),
    }


def transform_course(course_data: dict) -> dict:
    """
    Transform a course into our normalized data structure

    Args:
        course_data (dict): course data

    Returns:
        dict: normalized learning resource data
    """

    uid = course_data.get("legacy_uid")

    if not uid:
        uid = course_data.get("site_uid")

    if not uid:
        log.info(
            "Skipping %s, both site_uid and legacy_uid missing",
            course_data["slug"],
        )
        return None
    else:
        uid = uid.replace("-", "")
    course_data["run_id"] = uid

    extra_course_numbers = course_data.get("extra_course_numbers")

    if extra_course_numbers:
        extra_course_numbers = [num.strip() for num in extra_course_numbers.split(",")]
    else:
        extra_course_numbers = []
    term = course_data.get("term")
    year = course_data.get("year")
    readable_term = f"+{slugify(term)}" if term else ""
    readable_year = f"_{course_data.get('year')}" if year else ""
    readable_id = f"{course_data[PRIMARY_COURSE_ID]}{readable_term}{readable_year}"
    topics = transform_topics(
        [{"name": topic} for topics in course_data.get("topics") for topic in topics],
        OFFERED_BY["code"],
    )
    image_src = course_data.get("image_src")

    return {
        "readable_id": readable_id,
        "offered_by": copy.deepcopy(OFFERED_BY),
        "platform": PlatformType.ocw.name,
        "etl_source": ETLSource.ocw.name,
        "title": course_data["course_title"],
        "departments": course_data.get("department_numbers", []),
        "content_tags": course_data.get("learning_resource_types", []),
        "image": {
            "url": urljoin(settings.OCW_BASE_URL, image_src) if image_src else None,
            "description": course_data.get("course_image_metadata", {}).get(
                "description"
            ),
            "alt": (
                course_data.get("course_image_metadata", {})
                .get("image_metadata", {})
                .get("image-alt")
            ),
        },
        "description": clean_data(course_data["course_description_html"]),
        "url": course_data.get("url"),
        "last_modified": course_data.get("last_modified"),
        "published": True,
        "course": {
            "course_numbers": generate_course_numbers_json(
                course_data[PRIMARY_COURSE_ID],
                extra_nums=extra_course_numbers,
                is_ocw=True,
            ),
        },
        "topics": topics,
        "runs": [transform_run(course_data)],
        "resource_type": LearningResourceType.course.name,
        "unique_field": UNIQUE_FIELD,
        "availability": Availability.anytime.name,
        "delivery": parse_delivery(course_data),
        "license_cc": True,
    }


def extract_course(
    *,
    url_path: str,
    s3_resource: boto3.resource,
    force_overwrite: bool = False,
    start_timestamp: datetime | None = None,
) -> dict:
    """
    Extract OCW course data from S3

    Args:
        url_path (str): The course url path
        s3_resource (boto3.resource): Boto3 s3 resource
        force_overwrite (bool): Force incoming course data to overwrite existing data
        start_timestamp (timestamp): start timestamp of backpopulate command.

    Returns:
        dict of course info from S3
    """
    log.info("Syncing: %s ...", url_path)
    if not url_path.endswith("/"):
        url_path = f"{url_path}/"
    s3_data_object = s3_resource.Object(
        settings.OCW_LIVE_BUCKET, url_path + "data.json"
    )

    try:
        course_json = safe_load_json(
            get_s3_object_and_read(s3_data_object), s3_data_object.key
        )
        last_modified = s3_data_object.last_modified
    except:  # noqa: E722
        log.exception("Error encountered reading data.json for %s", url_path)
        return None

    # if course synced before, check if modified since then
    course_instance = LearningResource.objects.filter(
        platform=PlatformType.ocw.name, readable_id=course_json.get(PRIMARY_COURSE_ID)
    ).first()

    # Make sure that the data we are syncing is newer than what we already have
    if (  # pylint: disable=too-many-boolean-expressions
        course_instance
        and course_instance.last_modified
        and last_modified <= course_instance.last_modified
        and not force_overwrite
    ) or (
        start_timestamp
        and course_instance
        and start_timestamp <= course_instance.updated_on
    ):
        log.info("Already synced. No changes found for %s", url_path)
        return None

    log.info("Digesting %s...", url_path)

    run_slug = url_path.strip("/")

    return {
        **course_json,
        "last_modified": last_modified,
        "slug": run_slug,
        "url": urljoin(settings.OCW_BASE_URL, run_slug),
    }
