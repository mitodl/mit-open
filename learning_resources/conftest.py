"""Common test fixtures for learning_resources"""

from os import listdir
from pathlib import Path

import boto3
import pytest

from learning_resources.constants import PlatformType
from learning_resources.factories import (
    LearningResourceDepartmentFactory,
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
)

TEST_PREFIX = "PROD/9/9.15/Fall_2007/9-15-biochemistry-and-pharmacology-of-synaptic-transmission-fall-2007/"  # noqa: E501

TEST_JSON_PATH = f"./test_json/{TEST_PREFIX}0"
TEST_JSON_FILES = [
    f for f in listdir(TEST_JSON_PATH) if Path.is_file(Path(TEST_JSON_PATH, f))
]

OCW_TEST_PREFIX = "courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/"

OCW_TEST_JSON_PATH = f"./test_json/{OCW_TEST_PREFIX[:-1]}"


@pytest.fixture
def podcast_platform():
    """Return a  podcast platform"""
    return LearningResourcePlatformFactory.create(
        code=PlatformType.podcast.name, name=PlatformType.podcast.value
    )


def setup_s3(settings):
    """
    Set up the fake s3 data
    """
    # Fake the settings
    settings.AWS_ACCESS_KEY_ID = "abc"
    settings.AWS_SECRET_ACCESS_KEY = "abc"  # noqa: S105
    settings.OCW_CONTENT_BUCKET_NAME = "test_bucket"
    settings.OCW_LEARNING_COURSE_BUCKET_NAME = "testbucket2"
    # Create our fake bucket
    conn = boto3.resource(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    conn.create_bucket(Bucket=settings.OCW_CONTENT_BUCKET_NAME)

    # Add data to the fake bucket
    test_bucket = conn.Bucket(name=settings.OCW_CONTENT_BUCKET_NAME)
    for file in TEST_JSON_FILES:
        file_key = TEST_JSON_PATH.replace("./test_json/", "") + "/" + file
        with Path.open(Path(TEST_JSON_PATH, file)) as f:
            test_bucket.put_object(Key=file_key, Body=f.read())

    # Create our upload bucket
    conn = boto3.resource(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    conn.create_bucket(Bucket=settings.OCW_LEARNING_COURSE_BUCKET_NAME)


def add_file_to_bucket_recursive(bucket, file_base, s3_base, file_object):
    """
    Add file to fake s3 bucket
    """
    local_path = file_base + "/" + file_object
    file_key = s3_base + "/" + file_object

    if file_object[0] == ".":
        return

    elif (Path(file_base) / file_object).is_file():
        with Path.open(Path(local_path)) as f:
            bucket.put_object(Key=file_key, Body=f.read())
    else:
        for child in listdir(local_path):
            add_file_to_bucket_recursive(bucket, local_path, file_key, child)


def setup_s3_ocw(settings):
    """
    Set up the fake s3 data for OCW
    """
    # Fake the settings
    settings.AWS_ACCESS_KEY_ID = "abc"
    settings.AWS_SECRET_ACCESS_KEY = "abc"  # noqa: S105
    settings.OCW_LIVE_BUCKET = "test_bucket"
    # Create our fake bucket
    conn = boto3.resource(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    conn.create_bucket(Bucket=settings.OCW_LIVE_BUCKET)

    # Add data to the fake ocw next bucket
    ocw_next_bucket = conn.Bucket(name=settings.OCW_LIVE_BUCKET)

    base_folder = OCW_TEST_JSON_PATH.replace("./test_json/", "")

    for file in listdir(OCW_TEST_JSON_PATH):
        add_file_to_bucket_recursive(
            ocw_next_bucket, OCW_TEST_JSON_PATH, base_folder, file
        )
    LearningResourcePlatformFactory.create(code=PlatformType.ocw.name)
    LearningResourceOfferorFactory.create(is_ocw=True)
    LearningResourceDepartmentFactory.create(
        department_id="16", name="Aeronautics and Astronautics"
    )
