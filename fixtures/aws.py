"""Fixtures for AWS"""

# pylint: disable=redefined-outer-name
import logging
from types import SimpleNamespace

import boto3
import pytest
from moto import mock_s3


@pytest.fixture(autouse=True)
def silence_s3_logging():  # noqa: PT004
    """Only show S3 errors"""
    logging.getLogger("botocore").setLevel(logging.ERROR)


@pytest.fixture()
def mock_s3_fixture():  # noqa: PT004
    """Mock the S3 fixture for the duration of the test"""
    with mock_s3():
        yield


@pytest.fixture()
def aws_settings(settings):
    """Default AWS test settings"""  # noqa: D401
    settings.AWS_ACCESS_KEY_ID = "aws_id"
    settings.AWS_SECRET_ACCESS_KEY = (  # pragma: allowlist secret`
        "aws_secret"  # noqa: S105
    )
    return settings


@pytest.fixture(autouse=True)
def ocw_aws_settings(aws_settings):
    """Default OCW test settings"""  # noqa: D401
    aws_settings.OCW_LEARNING_COURSE_BUCKET_NAME = (  # impossible bucket name
        "test-bucket"
    )
    return aws_settings


@pytest.fixture()
def mock_ocw_learning_bucket(
    ocw_aws_settings, mock_s3_fixture  # noqa: ARG001
):  # pylint: disable=unused-argument
    """Mock OCW learning bucket"""
    s3 = boto3.resource(
        "s3",
        aws_access_key_id=ocw_aws_settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=ocw_aws_settings.AWS_SECRET_ACCESS_KEY,
    )
    bucket = s3.create_bucket(Bucket=ocw_aws_settings.OCW_LEARNING_COURSE_BUCKET_NAME)
    return SimpleNamespace(s3=s3, bucket=bucket)


@pytest.fixture(autouse=True)
def xpro_aws_settings(aws_settings):
    """Default xPRO test settings"""  # noqa: D401
    aws_settings.XPRO_LEARNING_COURSE_BUCKET_NAME = (  # impossible bucket name
        "test-xpro-bucket"
    )
    return aws_settings


@pytest.fixture(autouse=True)
def mitx_aws_settings(aws_settings):
    """Default MITx Online test settings"""  # noqa: D401
    aws_settings.EDX_LEARNING_COURSE_BUCKET_NAME = (  # impossible bucket name
        "test-mitx-bucket"
    )
    return aws_settings


@pytest.fixture(autouse=True)
def mitxonline_aws_settings(aws_settings):
    """Default MITx Online test settings"""  # noqa: D401
    aws_settings.MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME = (  # impossible bucket name
        "test-mitxonline-bucket"
    )
    return aws_settings


@pytest.fixture()
def mock_xpro_learning_bucket(
    xpro_aws_settings, mock_s3_fixture  # noqa: ARG001
):  # pylint: disable=unused-argument
    """Mock OCW learning bucket"""
    s3 = boto3.resource(
        "s3",
        aws_access_key_id=xpro_aws_settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=xpro_aws_settings.AWS_SECRET_ACCESS_KEY,
    )
    bucket = s3.create_bucket(Bucket=xpro_aws_settings.XPRO_LEARNING_COURSE_BUCKET_NAME)
    return SimpleNamespace(s3=s3, bucket=bucket)


@pytest.fixture()
def mock_mitxonline_learning_bucket(
    mitxonline_aws_settings, mock_s3_fixture  # noqa: ARG001
):  # pylint: disable=unused-argument
    """Mock OCW learning bucket"""
    s3 = boto3.resource(
        "s3",
        aws_access_key_id=mitxonline_aws_settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=mitxonline_aws_settings.AWS_SECRET_ACCESS_KEY,
    )
    bucket = s3.create_bucket(
        Bucket=mitxonline_aws_settings.MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME
    )
    return SimpleNamespace(s3=s3, bucket=bucket)


@pytest.fixture()
def mock_mitx_learning_bucket(
    mitx_aws_settings, mock_s3_fixture  # noqa: ARG001
):  # pylint: disable=unused-argument
    """Mock OCW learning bucket"""
    s3 = boto3.resource(
        "s3",
        aws_access_key_id=mitx_aws_settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=mitx_aws_settings.AWS_SECRET_ACCESS_KEY,
    )
    bucket = s3.create_bucket(Bucket=mitx_aws_settings.EDX_LEARNING_COURSE_BUCKET_NAME)
    return SimpleNamespace(s3=s3, bucket=bucket)
