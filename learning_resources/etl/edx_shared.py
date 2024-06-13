"""Shared functions for EdX sites"""

import logging
import re
from pathlib import Path
from tarfile import ReadError
from tempfile import TemporaryDirectory

from learning_resources.etl.constants import ETLSource
from learning_resources.etl.loaders import load_content_files
from learning_resources.etl.utils import (
    calc_checksum,
    get_learning_course_bucket,
    transform_content_files,
)
from learning_resources.models import LearningResourceRun

log = logging.getLogger(__name__)

EDX_S3_BASE_PREFIX = "20"


def get_most_recent_course_archives(
    etl_source: str, *, s3_prefix: str | None = None, override_base_prefix=False
) -> list[str]:
    """
    Retrieve a list of S3 keys for the most recent edx course archives

    Args:
        etl_source(str): The edx ETL source
        s3_prefix(str): The prefix for S3 object keys
        override_base_prefix(bool): Override the default prefix of "20"

    Returns:
        list of str: edx archive S3 keys
    """
    bucket = get_learning_course_bucket(etl_source)
    if not bucket:
        log.warning("No S3 bucket for platform %s", etl_source)
        return []
    if s3_prefix is None:
        s3_prefix = "courses"
    try:
        log.info("Getting recent archives from %s with prefix %s", bucket, s3_prefix)
        course_tar_regex = (
            rf"{s3_prefix}/.*\.tar\.gz$"
            if override_base_prefix
            else rf".*/{s3_prefix}/.*\.tar\.gz$"
        )
        most_recent_export_file = next(
            reversed(  # noqa: C413
                sorted(
                    [
                        obj
                        for obj in bucket.objects.filter(
                            # Use s3_prefix for OLL, "20" for all others
                            Prefix=s3_prefix
                            if override_base_prefix
                            else EDX_S3_BASE_PREFIX
                        )
                        if re.search(course_tar_regex, obj.key)
                    ],
                    key=lambda obj: obj.last_modified,
                )
            )
        )
        if override_base_prefix:
            # More hoops to get desired result from OLL compared to other sources
            most_recent_export_date = "/".join(
                [s3_prefix, most_recent_export_file.key.lstrip(s3_prefix).split("/")[0]]
            )
        else:
            most_recent_export_date = most_recent_export_file.key.split("/")[0]
        log.info("Most recent export date is %s", most_recent_export_date)
        return [
            obj.key
            for obj in bucket.objects.filter(Prefix=most_recent_export_date)
            if re.search(course_tar_regex, obj.key)
        ]
    except (StopIteration, IndexError):
        log.warning(
            "No %s exported courses found in S3 bucket %s", etl_source, bucket.name
        )
        return []


def sync_edx_course_files(
    etl_source: str, ids: list[int], keys: list[str], s3_prefix: str | None = None
):
    """
    Sync all edx course run files for a list of course ids to database

    Args:
        etl_source(str): The edx ETL source
        ids(list of int): list of course ids to process
        keys(list[str]): list of S3 archive keys to search through
        s3_prefix(str): path prefix to include in regex for S3
    """
    bucket = get_learning_course_bucket(etl_source)
    if s3_prefix is None:
        s3_prefix = "courses"
    for key in keys:
        matches = re.search(rf"{s3_prefix}/(.+)\.tar\.gz$", key)
        run_id = matches.group(1).split("/")[-1]
        log.info("Run is is %s", run_id)
        runs = LearningResourceRun.objects.filter(
            learning_resource__etl_source=etl_source,
            learning_resource_id__in=ids,
            published=True,
        )
        if etl_source == ETLSource.mit_edx.name:
            # Additional processing of run ids and tarfile names,
            # because edx data is structured differently
            run_id = run_id.strip(  # noqa: B005
                "-course-prod-analytics.xml"
            )  # suffix on edx tar file basename
            potential_run_ids = rf"{run_id.replace('-', '.').replace('+', '.')}"
            runs = runs.filter(run_id__iregex=potential_run_ids)
        elif etl_source == ETLSource.oll.name:
            # Additional processing of run ids and tarfile names,
            # because oll data is structured differently
            run_id = rf"{run_id.strip("_OLL").replace(
                '-', '.'
            ).replace('_', '.').replace('+', '.')}"  # noqa: B005
            runs = runs.filter(run_id__iregex=run_id)
        else:
            runs = runs.filter(run_id=run_id)
        log.info("There are %d runs for %s", runs.count(), run_id)
        run = runs.first()

        if not run:
            continue
        with TemporaryDirectory() as export_tempdir:
            course_tarpath = Path(export_tempdir, key.split("/")[-1])
            log.info("course tarpath for run %s is %s", run.run_id, course_tarpath)
            bucket.download_file(key, course_tarpath)
            try:
                checksum = calc_checksum(course_tarpath)
            except ReadError:
                log.exception("Error reading tar file %s, skipping", course_tarpath)
                continue
            if run.checksum == checksum:
                log.info("Checksums match for %s, skipping", key)
                continue
            try:
                load_content_files(run, transform_content_files(course_tarpath, run))
                run.checksum = checksum
                run.save()
            except:  # noqa: E722
                log.exception("Error ingesting OLX content data for %s", key)
