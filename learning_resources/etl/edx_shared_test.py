"""ETL utils test"""

from pathlib import Path

import pytest

from learning_resources.constants import PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.edx_shared import (
    get_most_recent_course_archives,
    sync_edx_course_files,
)
from learning_resources.factories import (
    CourseFactory,
    LearningResourceFactory,
    LearningResourcePlatformFactory,
    LearningResourceRunFactory,
)

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    ("source", "platform", "s3_prefix"),
    [
        (ETLSource.mitxonline.name, PlatformType.mitxonline.name, "courses"),
        (ETLSource.xpro.name, PlatformType.xpro.name, "courses"),
        (ETLSource.mit_edx.name, PlatformType.edx.name, "simeon-mitx-course-tarballs"),
        (ETLSource.oll.name, PlatformType.edx.name, "open-learning-library/courses"),
    ],
)
@pytest.mark.parametrize("published", [True, False])
def test_sync_edx_course_files(  # noqa: PLR0913
    mock_mitxonline_learning_bucket,
    mock_xpro_learning_bucket,
    mock_oll_learning_bucket,
    mocker,
    source,
    platform,
    s3_prefix,
    published,
):  # pylint: disable=too-many-arguments,too-many-locals
    """Sync edx courses from a tarball stored in S3"""
    mock_load_content_files = mocker.patch(
        "learning_resources.etl.edx_shared.load_content_files",
        autospec=True,
        return_value=[],
    )
    mock_log = mocker.patch("learning_resources.etl.utils.log.exception")
    fake_data = '{"key": "data"}'
    mock_transform = mocker.patch(
        "learning_resources.etl.edx_shared.transform_content_files",
        return_value=fake_data,
    )
    bucket = (
        mock_mitxonline_learning_bucket
        if source == ETLSource.mitxonline.name
        else mock_xpro_learning_bucket
        if source == ETLSource.xpro.name
        else mock_oll_learning_bucket
    ).bucket
    mocker.patch(
        "learning_resources.etl.edx_shared.get_learning_course_bucket",
        return_value=bucket,
    )
    courses = LearningResourceFactory.create_batch(
        2,
        platform=LearningResourcePlatformFactory.create(code=platform),
        etl_source=source,
        is_course=True,
        published=True,
        create_runs=False,
    )
    keys = []
    for course in courses:
        runs = LearningResourceRunFactory.create_batch(
            2,
            learning_resource=course,
            published=published,
        )
        course.refresh_from_db()
        if published:
            assert course.next_run in runs
        keys.extend(
            [f"20220101/{s3_prefix}/{run.run_id}.tar.gz" for run in runs]
            if source != ETLSource.oll.name
            else [f"{s3_prefix}/20220101/{run.run_id}_OLL.tar.gz" for run in runs]
        )
        for key in keys:
            with Path.open(
                Path("test_json/course-v1:MITxT+8.01.3x+3T2022.tar.gz"), "rb"
            ) as infile:
                bucket.put_object(
                    Key=key,
                    Body=infile.read(),
                    ACL="public-read",
                )
    sync_edx_course_files(source, [course.id for course in courses], keys, s3_prefix)
    assert mock_transform.call_count == (2 if published else 0)
    assert mock_load_content_files.call_count == (2 if published else 0)
    if published:
        for course in courses:
            mock_load_content_files.assert_any_call(course.next_run, fake_data)
    mock_log.assert_not_called()


def test_sync_edx_course_files_matching_checksum(
    mocker, mock_mitxonline_learning_bucket
):
    """If the checksum matches, the contentfile loading should be skipped but other runs still deindexed"""

    run = LearningResourceFactory.create(
        is_course=True, create_runs=True, etl_source=ETLSource.mitxonline.name
    ).next_run
    other_run = run.learning_resource.runs.exclude(id=run.id).first()
    run.checksum = "123"
    run.save()
    mocker.patch(
        "learning_resources.etl.edx_shared.calc_checksum", return_value=run.checksum
    )
    mock_index = mocker.patch(
        "learning_resources_search.plugins.tasks.index_run_content_files"
    )
    mock_deindex = mocker.patch(
        "learning_resources_search.plugins.tasks.deindex_run_content_files"
    )
    mock_log = mocker.patch("learning_resources.etl.edx_shared.log.info")
    mock_load = mocker.patch("learning_resources.etl.edx_shared.load_content_files")

    key = f"20220101/courses/{run.run_id}.tar.gz"
    bucket = (mock_mitxonline_learning_bucket).bucket
    mocker.patch(
        "learning_resources.etl.edx_shared.get_learning_course_bucket",
        return_value=bucket,
    )
    bucket.put_object(
        Key=key,
        Body=b"".join([b"x" for _ in range(100)]),
        ACL="public-read",
    )
    sync_edx_course_files("mitxonline", [run.learning_resource.id], [key])
    mock_log.assert_any_call("Checksums match for %s, skipping load", key)
    mock_deindex.assert_called_once_with(other_run.id, False)  # noqa: FBT003
    mock_load.assert_not_called()
    mock_index.assert_not_called()


@pytest.mark.parametrize(
    "platform", [PlatformType.mitxonline.name, PlatformType.xpro.name]
)
def test_sync_edx_course_files_invalid_tarfile(
    mock_mitxonline_learning_bucket, mock_xpro_learning_bucket, mocker, platform
):
    """An invalid mitxonline tarball should be skipped"""
    course = LearningResourceFactory.create(
        platform=LearningResourcePlatformFactory.create(code=platform),
        etl_source=platform,
        published=True,
        create_runs=True,
    )
    run = course.next_run
    key = f"20220101/courses/{run.run_id}.tar.gz"
    bucket = (
        mock_mitxonline_learning_bucket
        if platform == PlatformType.mitxonline.name
        else mock_xpro_learning_bucket
    ).bucket
    bucket.put_object(
        Key=key,
        Body=b"".join([b"x" for _ in range(100)]),
        ACL="public-read",
    )
    mocker.patch(
        "learning_resources.etl.edx_shared.get_learning_course_bucket",
        return_value=bucket,
    )
    mock_log = mocker.patch("learning_resources.etl.edx_shared.log.exception")

    sync_edx_course_files(platform, [run.learning_resource.id], [key])
    mock_log.assert_called_once()
    assert mock_log.call_args[0][0].startswith("Error reading tar file") is True


@pytest.mark.parametrize(
    "platform", [PlatformType.mitxonline.name, PlatformType.xpro.name]
)
def test_sync_edx_course_files_empty_bucket(
    mock_mitxonline_learning_bucket, mock_xpro_learning_bucket, mocker, platform
):
    """If the mitxonline bucket has no tarballs matching a filename, it should be skipped"""
    run = LearningResourceRunFactory.create(
        learning_resource=CourseFactory.create(
            platform=platform, etl_source=platform
        ).learning_resource,
    )
    key = "20220101/courses/some_other_course.tar.gz"
    bucket = (
        mock_mitxonline_learning_bucket
        if platform == PlatformType.mitxonline.name
        else mock_xpro_learning_bucket
    ).bucket
    with Path.open(
        Path("test_json/course-v1:MITxT+8.01.3x+3T2022.tar.gz"), "rb"
    ) as infile:
        bucket.put_object(
            Key=key,
            Body=infile.read(),
            ACL="public-read",
        )
    mock_load_content_files = mocker.patch(
        "learning_resources.etl.edx_shared.load_content_files",
        autospec=True,
        return_value=[],
    )
    mocker.patch(
        "learning_resources.etl.edx_shared.get_learning_course_bucket",
        return_value=bucket,
    )
    sync_edx_course_files(platform, [run.learning_resource.id], [key])
    mock_load_content_files.assert_not_called()


@pytest.mark.parametrize(
    "platform", [PlatformType.mitxonline.name, PlatformType.xpro.name]
)
def test_sync_edx_course_files_error(
    mock_mitxonline_learning_bucket, mock_xpro_learning_bucket, mocker, platform
):
    """Exceptions raised during sync_mitxonline_course_files should be logged"""
    course = LearningResourceFactory.create(
        platform=LearningResourcePlatformFactory.create(code=platform),
        etl_source=platform,
        published=True,
        create_runs=True,
    )
    run = course.next_run
    key = f"20220101/courses/{run.run_id}.tar.gz"
    bucket = (
        mock_mitxonline_learning_bucket
        if platform == PlatformType.mitxonline.value
        else mock_xpro_learning_bucket
    ).bucket
    with Path.open(
        Path("test_json/course-v1:MITxT+8.01.3x+3T2022.tar.gz"), "rb"
    ) as infile:
        bucket.put_object(
            Key=key,
            Body=infile.read(),
            ACL="public-read",
        )
    mocker.patch(
        "learning_resources.etl.edx_shared.get_learning_course_bucket",
        return_value=bucket,
    )
    mock_load_content_files = mocker.patch(
        "learning_resources.etl.edx_shared.load_content_files",
        autospec=True,
        side_effect=Exception,
    )
    fake_data = '{"key": "data"}'
    mock_log = mocker.patch("learning_resources.etl.edx_shared.log.exception")
    mock_transform = mocker.patch(
        "learning_resources.etl.edx_shared.transform_content_files",
        return_value=fake_data,
    )
    sync_edx_course_files(platform, [run.learning_resource.id], [key])
    assert mock_transform.call_count == 1
    assert str(mock_transform.call_args[0][0]).endswith(f"{run.run_id}.tar.gz") is True
    mock_load_content_files.assert_called_once_with(run, fake_data)
    assert mock_log.call_args[0][0].startswith("Error ingesting OLX content data for ")


@pytest.mark.parametrize("platform", [PlatformType.edx.value, PlatformType.xpro.value])
def test_get_most_recent_course_archives(
    mocker, mock_mitxonline_learning_bucket, platform
):
    """get_most_recent_course_archives should return expected keys"""
    bucket = mock_mitxonline_learning_bucket.bucket
    base_key = "0101/courses/my-course.tar.gz"
    with Path.open(
        Path("test_json/course-v1:MITxT+8.01.3x+3T2022.tar.gz"), "rb"
    ) as infile:
        body = infile.read()
    for year in [2021, 2022, 2023]:
        bucket.put_object(
            Key=f"{year}{base_key}",
            Body=body,
            ACL="public-read",
        )
    mock_get_bucket = mocker.patch(
        "learning_resources.etl.edx_shared.get_learning_course_bucket",
        return_value=bucket,
    )
    assert get_most_recent_course_archives(platform) == [f"2023{base_key}"]
    mock_get_bucket.assert_called_once_with(platform)


@pytest.mark.parametrize("source", [ETLSource.mit_edx.value, ETLSource.xpro.value])
def test_get_most_recent_course_archives_empty(
    mocker, mock_mitxonline_learning_bucket, source
):
    """Empty list should be returned and a warning logged if no recent tar archives are found"""
    bucket = mock_mitxonline_learning_bucket.bucket
    mock_get_bucket = mocker.patch(
        "learning_resources.etl.edx_shared.get_learning_course_bucket",
        return_value=bucket,
    )
    mock_warning = mocker.patch("learning_resources.etl.edx_shared.log.warning")
    assert get_most_recent_course_archives(source) == []
    mock_get_bucket.assert_called_once_with(source)
    mock_warning.assert_called_once_with(
        "No %s exported courses found in S3 bucket %s", source, bucket.name
    )


@pytest.mark.parametrize("platform", [PlatformType.edx.value, PlatformType.xpro.value])
def test_get_most_recent_course_archives_no_bucket(settings, mocker, platform):
    """Empty list should be returned and a warning logged if no bucket is found"""
    settings.EDX_LEARNING_COURSE_BUCKET_NAME = None
    settings.XPRO_LEARNING_COURSE_BUCKET_NAME = None
    mock_warning = mocker.patch("learning_resources.etl.edx_shared.log.warning")
    assert get_most_recent_course_archives(platform) == []
    mock_warning.assert_called_once_with("No S3 bucket for platform %s", platform)
