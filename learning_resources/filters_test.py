"""Tests for learning_resources Filters"""

from types import SimpleNamespace

import pytest
from django.utils.http import urlencode

from learning_resources.constants import (
    LEARNING_MATERIAL_RESOURCE_CATEGORY,
    LEARNING_RESOURCE_SORTBY_OPTIONS,
    CertificationType,
    LearningResourceDelivery,
    LearningResourceFormat,
    LearningResourceType,
    LevelType,
    OfferedBy,
    PlatformType,
)
from learning_resources.factories import (
    ContentFileFactory,
    CourseFactory,
    LearningResourceContentTagFactory,
    LearningResourceFactory,
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
    LearningResourceRunFactory,
    PodcastEpisodeFactory,
    PodcastFactory,
    ProgramFactory,
    VideoFactory,
    VideoPlaylistFactory,
)
from learning_resources.models import ContentFile, LearningResource, LearningResourceRun

pytestmark = pytest.mark.django_db

RESOURCE_API_URL = "/api/v1/learning_resources/"
COURSE_API_URL = "/api/v1/courses/"
PODCAST_API_URL = "/api/v1/podcasts/"
PODCAST_EPISODE_API_URL = "/api/v1/podcast_episodes/"
VIDEOS_API_URL = "/api/v1/videos/"
CONTENT_API_URL = "/api/v1/contentfiles/"
VIDEO_PLAYLISTS_API_URL = "/api/v1/video_playlists/"


@pytest.fixture
def mock_courses():
    """Mock courses"""
    ocw_course = CourseFactory.create(
        platform=PlatformType.ocw.name,
        department="7",
        offered_by=OfferedBy.ocw.name,
    ).learning_resource

    mitx_course = CourseFactory.create(
        platform=PlatformType.mitxonline.name,
        department="8",
        offered_by=OfferedBy.mitx.name,
        is_professional=False,
        has_certification=True,
    ).learning_resource

    mitpe_course = CourseFactory.create(
        platform=PlatformType.mitpe.name,
        department="9",
        offered_by=OfferedBy.mitpe.name,
        is_professional=True,
        has_certification=True,
    ).learning_resource

    return SimpleNamespace(
        ocw_course=ocw_course, mitx_course=mitx_course, mitpe_course=mitpe_course
    )


@pytest.fixture
def mock_content_files():
    content_files = []
    for platform, offeror in [
        [PlatformType.ocw.name, OfferedBy.ocw.name],
        [PlatformType.xpro.name, OfferedBy.xpro.name],
        [PlatformType.mitxonline.name, OfferedBy.mitx.name],
    ]:
        content_files.append(
            ContentFileFactory.create(
                run=LearningResourceRunFactory.create(
                    learning_resource=LearningResourceFactory.create(
                        platform=LearningResourcePlatformFactory.create(code=platform),
                        offered_by=LearningResourceOfferorFactory.create(code=offeror),
                    )
                )
            ),
        )
    ContentFile.objects.exclude(id__in=[cf.id for cf in content_files[:2]]).delete()
    return content_files


def test_learning_resource_filter_department(mock_courses, client):
    """Test that the department_id filter works"""
    ocw_department = mock_courses.ocw_course.departments.first()
    mitx_department = mock_courses.mitx_course.departments.first()

    results = client.get(
        f"{RESOURCE_API_URL}?department={ocw_department.department_id}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == mock_courses.ocw_course.readable_id

    dept_filter = f"department={ocw_department.department_id}&department={mitx_department.department_id}"
    results = client.get(f"{RESOURCE_API_URL}?{dept_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.ocw_course.readable_id, mock_courses.mitx_course.readable_id]
    )


def test_learning_resource_filter_offered_by(mock_courses, client):
    """Test that the offered_by filter works"""

    ocw_offeror = mock_courses.ocw_course.offered_by
    mitx_offeror = mock_courses.mitx_course.offered_by

    results = client.get(f"{RESOURCE_API_URL}?offered_by={ocw_offeror.code}").json()[
        "results"
    ]
    assert len(results) == 1
    assert results[0]["readable_id"] == mock_courses.ocw_course.readable_id

    offered_filter = f"offered_by={ocw_offeror.code}&offered_by={mitx_offeror.code}"
    results = client.get(f"{RESOURCE_API_URL}?{offered_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.ocw_course.readable_id, mock_courses.mitx_course.readable_id]
    )


def test_learning_resource_filter_platform(mock_courses, client):
    """Test that the platform filter works"""

    ocw_platform = mock_courses.ocw_course.platform
    mitx_platform = mock_courses.mitx_course.platform

    results = client.get(f"{RESOURCE_API_URL}?platform={ocw_platform.code}").json()[
        "results"
    ]
    assert len(results) == 1
    assert results[0]["readable_id"] == mock_courses.ocw_course.readable_id

    platform_filter = f"platform={ocw_platform.code}&platform={mitx_platform.code}"
    results = client.get(f"{RESOURCE_API_URL}?{platform_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.ocw_course.readable_id, mock_courses.mitx_course.readable_id]
    )


@pytest.mark.parametrize("is_professional", [True, False])
def test_learning_resource_filter_professional(is_professional, client):
    """Test that the professional filter works"""

    professional_course = CourseFactory.create(
        platform=PlatformType.xpro.name, is_professional=True
    ).learning_resource
    open_course = CourseFactory.create(
        platform=PlatformType.xpro.name
    ).learning_resource

    results = client.get(f"{RESOURCE_API_URL}?professional={is_professional}").json()[
        "results"
    ]
    assert len(results) == 1
    assert results[0]["id"] == (
        professional_course.id if is_professional else open_course.id
    )


@pytest.mark.parametrize("offers_certification", [True, False])
def test_learning_resource_filter_certification(offers_certification, client):
    """Test that the certification filter works"""

    certified_course = CourseFactory.create(
        platform=PlatformType.xpro.name, has_certification=True
    ).learning_resource
    uncertified_course = CourseFactory.create(
        platform=PlatformType.xpro.name, has_certification=False
    ).learning_resource

    results = client.get(
        f"{RESOURCE_API_URL}?certification={offers_certification}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == (
        certified_course.id if offers_certification else uncertified_course.id
    )


def test_learning_resource_filter_certification_type(mock_courses, client):
    """Test that the certification_type filter works"""

    assert mock_courses.mitpe_course.offered_by.professional is True
    assert mock_courses.mitpe_course.certification is True
    assert mock_courses.mitx_course.professional is False
    assert mock_courses.mitx_course.certification is True
    assert mock_courses.ocw_course.certification is False
    assert mock_courses.ocw_course.professional is False

    pro_results = client.get(
        f"{RESOURCE_API_URL}?certification_type={CertificationType.professional.name}"
    ).json()["results"]
    assert len(pro_results) == 1
    assert pro_results[0]["readable_id"] == mock_courses.mitpe_course.readable_id

    completion_results = client.get(
        f"{RESOURCE_API_URL}?certification_type={CertificationType.completion.name}"
    ).json()["results"]
    assert len(completion_results) == 1
    assert completion_results[0]["readable_id"] == mock_courses.mitx_course.readable_id

    none_results = client.get(
        f"{RESOURCE_API_URL}?certification_type={CertificationType.none.name}"
    ).json()["results"]
    assert len(none_results) == 1
    assert none_results[0]["readable_id"] == mock_courses.ocw_course.readable_id

    micromaster_results = client.get(
        f"{RESOURCE_API_URL}?certification_type={CertificationType.micromasters.name}"
    ).json()["results"]
    assert len(micromaster_results) == 0


def test_learning_resource_filter_free(client):
    """Test that the free filter works"""

    free_course = LearningResourceFactory.create(
        is_course=True, runs=[], professional=False
    )
    LearningResourceRunFactory.create(learning_resource=free_course, prices=[0.00])

    paid_course = LearningResourceFactory.create(is_course=True, runs=[])
    LearningResourceRunFactory.create(
        learning_resource=paid_course, prices=[50.00, 100.00]
    )

    free2pay_course = LearningResourceFactory(
        is_course=True, runs=[], professional=False
    )
    LearningResourceRunFactory.create(
        learning_resource=free2pay_course, prices=[0.00, 100.00]
    )

    priceless_pro_course = LearningResourceFactory(
        is_course=True, runs=[], professional=True
    )
    LearningResourceRunFactory.create(learning_resource=priceless_pro_course, prices=[])

    always_free_podcast_episode = LearningResourceFactory.create(
        is_podcast_episode=True, professional=False
    )

    results = client.get(f"{RESOURCE_API_URL}?free=true").json()["results"]
    assert len(results) == 3
    for resource in [free_course, free2pay_course, always_free_podcast_episode]:
        assert resource.id in [result["id"] for result in results]
    results = client.get(f"{RESOURCE_API_URL}?free=false").json()["results"]
    assert len(results) == 2
    for resource in [paid_course, priceless_pro_course]:
        assert resource.id in [result["id"] for result in results]


def test_learning_resource_filter_resource_category(client):
    """Test that the resource type filter works"""
    program = ProgramFactory.create().learning_resource
    CourseFactory.create()

    podcast = PodcastEpisodeFactory.create().learning_resource
    video = VideoFactory.create().learning_resource

    results = client.get(
        f"{RESOURCE_API_URL}?resource_category={LEARNING_MATERIAL_RESOURCE_CATEGORY}"
    ).json()["results"]
    assert len(results) == 2
    ids = (res["id"] for res in results)
    assert podcast.id in ids
    assert video.id in ids

    resource_filter = f"resource_category={LearningResourceType.program.name}&resource_category={LEARNING_MATERIAL_RESOURCE_CATEGORY}"
    results = client.get(f"{RESOURCE_API_URL}?{resource_filter}").json()["results"]
    assert len(results) == 3
    ids = (res["id"] for res in results)
    assert program.id in ids
    assert podcast.id in ids
    assert video.id in ids


def test_learning_resource_filter_readable_id(client):
    """Test that the readable id filter works for learning resources"""
    courses = CourseFactory.create_batch(5)
    resource = courses[0].learning_resource
    results = client.get(
        f"{RESOURCE_API_URL}?{urlencode({'readable_id':resource.readable_id})}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == resource.readable_id


def test_course_filter_readable_id(client):
    """Test that the readable id filter works for courses"""
    courses = CourseFactory.create_batch(5)
    resource = courses[0].learning_resource
    results = client.get(
        f"{COURSE_API_URL}?{urlencode({'readable_id':resource.readable_id})}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == resource.readable_id


def test_podcast_filter_readable_id(client):
    """Test that the readable id filter works for video podcasts"""
    podcasts = PodcastFactory.create_batch(5)
    resource = podcasts[0].learning_resource
    results = client.get(
        f"{PODCAST_API_URL}?{urlencode({'readable_id':resource.readable_id})}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == resource.readable_id


def test_podcast_episode_filter_readable_id(client):
    """Test that the readable id filter works for podcast episodes"""
    podcast_episodes = PodcastEpisodeFactory.create_batch(5)
    resource = podcast_episodes[0].learning_resource
    results = client.get(
        f"{PODCAST_EPISODE_API_URL}?{urlencode({'readable_id':resource.readable_id})}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == resource.readable_id


def test_video_filter_readable_id(client):
    """Test that the readable id filter works for videos"""
    videos = VideoFactory.create_batch(5)
    resource = videos[0].learning_resource
    results = client.get(
        f"{VIDEOS_API_URL}?{urlencode({'readable_id':resource.readable_id})}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == resource.readable_id


def test_video_playlist_filter_readable_id(client):
    """Test that the readable id filter works for video playlists"""
    channels = VideoPlaylistFactory.create_batch(5)
    resource = channels[0].learning_resource
    results = client.get(
        f"{VIDEO_PLAYLISTS_API_URL}?{urlencode({'readable_id':resource.readable_id})}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == resource.readable_id


@pytest.mark.parametrize("sortby", ["readable_id", "id"])
@pytest.mark.parametrize("descending", [True, False])
def test_learning_resource_sortby(client, sortby, descending):
    """Test that the query is sorted in the correct order"""
    resources = [course.learning_resource for course in CourseFactory.create_batch(3)]
    sortby_param = sortby
    if descending:
        sortby_param = f"-{sortby}"

    results = client.get(f"{RESOURCE_API_URL}?sortby={sortby_param}").json()["results"]

    assert [result["id"] for result in results] == sorted(
        [
            resource.id
            for resource in sorted(
                resources,
                key=lambda x: getattr(
                    x, LEARNING_RESOURCE_SORTBY_OPTIONS[sortby]["sort"]
                ),
            )
        ],
        reverse=descending,
    )


def test_learning_resource_sortby_new(client):
    """Test that the query is sorted in the correct order"""
    resources = [course.learning_resource for course in CourseFactory.create_batch(3)]
    sortby_param = "new"

    results = client.get(f"{RESOURCE_API_URL}?sortby={sortby_param}").json()["results"]

    assert [result["id"] for result in results] == sorted(
        [
            resource.id
            for resource in sorted(
                resources,
                key=lambda x: x.created_on,
            )
        ],
        reverse=True,
    )


def test_learning_resource_filter_topics(mock_courses, client):
    """Test that the topic filter works"""
    assert (
        list(
            set(mock_courses.ocw_course.topics.all().values_list("name", flat=True))
            & set(mock_courses.mitx_course.topics.all().values_list("name", flat=True))
        )
        == []
    )

    results = client.get(
        f"{RESOURCE_API_URL}?topic={mock_courses.mitx_course.topics.first().name.lower()}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_courses.mitx_course.id

    topic_filter = f"topic={mock_courses.mitx_course.topics.first().name.lower()}&topic={mock_courses.ocw_course.topics.first().name.upper()}"
    results = client.get(f"{RESOURCE_API_URL}?{topic_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.mitx_course.readable_id, mock_courses.ocw_course.readable_id]
    )


def test_learning_resource_filter_course_features(client):
    """Test that the resource_content_tag filter works"""

    resource_with_exams = LearningResourceFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(1, name="Exams")
    )
    resource_with_notes = LearningResourceFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(
            1, name="Lecture Notes"
        )
    )
    LearningResourceFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(1, name="Other")
    )

    results = client.get(f"{RESOURCE_API_URL}?course_feature=exams").json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == resource_with_exams.id

    feature_filter = "course_feature={}&course_feature={}".format(
        "EXAMS", "lEcture nOtes"
    )
    results = client.get(f"{RESOURCE_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [resource_with_exams.readable_id, resource_with_notes.readable_id]
    )


def test_learning_resource_filter_level(client):
    """Test that the level filter works"""

    hs_run = LearningResourceRunFactory.create(
        level=[LevelType.high_school.name, LevelType.undergraduate.name]
    )
    grad_run = LearningResourceRunFactory.create(
        level=[LevelType.undergraduate.name, LevelType.graduate.name]
    )
    other_run = LearningResourceRunFactory.create(level=[LevelType.advanced.name])

    LearningResourceRun.objects.exclude(
        id__in=[hs_run.id, grad_run.id, other_run.id]
    ).delete()

    results = client.get(f"{RESOURCE_API_URL}?level=high_school").json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == hs_run.learning_resource.id

    results = client.get(f"{RESOURCE_API_URL}?level=graduate").json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == grad_run.learning_resource.id

    results = client.get(f"{RESOURCE_API_URL}?level=high_school&level=graduate").json()[
        "results"
    ]
    assert len(results) == 2


def test_learning_resource_filter_formats(mock_courses, client):
    """Test that the learning_format filter works"""
    LearningResource.objects.filter(id=mock_courses.ocw_course.id).update(
        learning_format=[LearningResourceFormat.online.name]
    )
    LearningResource.objects.filter(id=mock_courses.mitx_course.id).update(
        learning_format=[
            LearningResourceFormat.online.name,
            LearningResourceFormat.hybrid.name,
        ]
    )
    LearningResource.objects.filter(id=mock_courses.mitpe_course.id).update(
        learning_format=[
            LearningResourceFormat.hybrid.name,
            LearningResourceFormat.in_person.name,
        ]
    )

    results = client.get(
        f"{RESOURCE_API_URL}?learning_format={LearningResourceFormat.in_person.name}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_courses.mitpe_course.id

    multiformats_filter = f"learning_format={LearningResourceFormat.in_person.name}&learning_format={LearningResourceFormat.hybrid.name}"
    results = client.get(f"{RESOURCE_API_URL}?{multiformats_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.mitx_course.readable_id, mock_courses.mitpe_course.readable_id]
    )


def test_learning_resource_filter_delivery(mock_courses, client):
    """Test that the delivery filter works"""
    LearningResource.objects.filter(id=mock_courses.ocw_course.id).update(
        delivery=[LearningResourceDelivery.online.name]
    )
    LearningResource.objects.filter(id=mock_courses.mitx_course.id).update(
        delivery=[
            LearningResourceDelivery.online.name,
            LearningResourceDelivery.hybrid.name,
        ]
    )
    LearningResource.objects.filter(id=mock_courses.mitpe_course.id).update(
        delivery=[
            LearningResourceDelivery.hybrid.name,
            LearningResourceDelivery.in_person.name,
        ]
    )

    results = client.get(
        f"{RESOURCE_API_URL}?delivery={LearningResourceDelivery.in_person.name}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_courses.mitpe_course.id

    multiformats_filter = f"delivery={LearningResourceDelivery.in_person.name}&delivery={LearningResourceDelivery.hybrid.name}"
    results = client.get(f"{RESOURCE_API_URL}?{multiformats_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.mitx_course.readable_id, mock_courses.mitpe_course.readable_id]
    )


def test_content_file_filter_run_id(mock_content_files, client):
    """Test that the run_id filter works for contentfiles"""

    results = client.get(
        f"{CONTENT_API_URL}?run_id={mock_content_files[1].run.id}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_content_files[1].id

    feature_filter = (
        f"run_id={mock_content_files[0].run.id}&run_id={mock_content_files[1].run.id}"
    )
    results = client.get(f"{CONTENT_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["run_id"] for result in results]) == sorted(
        [mock_content_files[0].run.id, mock_content_files[1].run.id]
    )


def test_content_file_filter_resource_id(mock_content_files, client):
    """Test that the resource_id filter works for contentfiles"""

    results = client.get(
        f"{CONTENT_API_URL}?resource_id={mock_content_files[1].run.learning_resource.id}"
    ).json()["results"]
    assert len(results) == 1
    assert (
        int(results[0]["resource_id"]) == mock_content_files[1].run.learning_resource.id
    )

    feature_filter = f"resource_id={mock_content_files[0].run.learning_resource.id}&resource_id={mock_content_files[1].run.learning_resource.id}"
    results = client.get(f"{CONTENT_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([int(result["resource_id"]) for result in results]) == sorted(
        [
            mock_content_files[0].run.learning_resource.id,
            mock_content_files[1].run.learning_resource.id,
        ]
    )


def test_content_file_filter_platform(mock_content_files, client):
    """Test that the platform filter works"""

    results = client.get(
        f"{CONTENT_API_URL}?platform={mock_content_files[1].run.learning_resource.platform.code}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_content_files[1].id

    platform_filter = f"platform={mock_content_files[1].run.learning_resource.platform.code}&platform={mock_content_files[0].run.learning_resource.platform.code}"
    results = client.get(f"{CONTENT_API_URL}?{platform_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [cf.id for cf in mock_content_files[:2]]
    )


def test_content_file_filter_offered_by(mock_content_files, client):
    """Test that the offered_by filter works for contentfiles"""

    results = client.get(
        f"{CONTENT_API_URL}?offered_by={mock_content_files[1].run.learning_resource.offered_by.code}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_content_files[1].id

    offered_filter = f"offered_by={mock_content_files[1].run.learning_resource.offered_by.code}&offered_by={mock_content_files[0].run.learning_resource.offered_by.code}"
    results = client.get(f"{CONTENT_API_URL}?{offered_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [cf.id for cf in mock_content_files[:2]]
    )


def test_learning_resource_filter_content_feature_type(client):
    """Test that the resource_content_tag filter works"""

    cf_with_exams = ContentFileFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(1, name="Exams")
    )
    cf_with_notes = ContentFileFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(
            1, name="Lecture Notes"
        )
    )
    ContentFileFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(1, name="Other")
    )

    results = client.get(f"{CONTENT_API_URL}?content_feature_type=exams").json()[
        "results"
    ]
    assert len(results) == 1
    assert results[0]["id"] == cf_with_exams.id

    feature_filter = "content_feature_type={}&content_feature_type={}".format(
        "EXAMS", "lEcture nOtes"
    )
    results = client.get(f"{CONTENT_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [cf_with_exams.id, cf_with_notes.id]
    )
