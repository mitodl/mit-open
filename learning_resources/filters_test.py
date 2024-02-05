"""Tests for learning_resources Filters"""

from types import SimpleNamespace

import pytest

from learning_resources.constants import (
    LEARNING_RESOURCE_SORTBY_OPTIONS,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.factories import (
    ContentFileFactory,
    CourseFactory,
    LearningPathFactory,
    LearningResourceContentTagFactory,
    LearningResourceFactory,
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
    LearningResourceRunFactory,
    PodcastFactory,
    ProgramFactory,
)
from learning_resources.models import ContentFile, LearningResourceRun

pytestmark = pytest.mark.django_db

RESOURCE_API_URL = "/api/v1/learning_resources/"
CONTENT_API_URL = "/api/v1/contentfiles/"


@pytest.fixture()
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
    ).learning_resource

    mitpe_course = CourseFactory.create(
        platform=PlatformType.mitpe.name,
        department="9",
        offered_by=OfferedBy.mitpe.name,
    ).learning_resource

    return SimpleNamespace(
        ocw_course=ocw_course, mitx_course=mitx_course, mitpe_course=mitpe_course
    )


@pytest.fixture()
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


@pytest.mark.parametrize(
    "multifilter", ["department={}&department={}", "department={},{}"]
)
def test_learning_resource_filter_department(mock_courses, client, multifilter):
    """Test that the department_id filter works"""
    ocw_department = mock_courses.ocw_course.departments.first()
    mitx_department = mock_courses.mitx_course.departments.first()

    results = client.get(
        f"{RESOURCE_API_URL}?department={ocw_department.department_id}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["readable_id"] == mock_courses.ocw_course.readable_id

    dept_filter = multifilter.format(
        ocw_department.department_id, mitx_department.department_id
    )
    results = client.get(f"{RESOURCE_API_URL}?{dept_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.ocw_course.readable_id, mock_courses.mitx_course.readable_id]
    )


@pytest.mark.parametrize(
    "multifilter", ["offered_by={}&offered_by={}", "offered_by={},{}"]
)
def test_learning_resource_filter_offered_by(mock_courses, client, multifilter):
    """Test that the offered_by filter works"""

    ocw_offeror = mock_courses.ocw_course.offered_by
    mitx_offeror = mock_courses.mitx_course.offered_by

    results = client.get(f"{RESOURCE_API_URL}?offered_by={ocw_offeror.code}").json()[
        "results"
    ]
    assert len(results) == 1
    assert results[0]["readable_id"] == mock_courses.ocw_course.readable_id

    offered_filter = multifilter.format(ocw_offeror.code, mitx_offeror.code)
    results = client.get(f"{RESOURCE_API_URL}?{offered_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.ocw_course.readable_id, mock_courses.mitx_course.readable_id]
    )


@pytest.mark.parametrize("multifilter", ["platform={}&platform={}", "platform={},{}"])
def test_learning_resource_filter_platform(mock_courses, client, multifilter):
    """Test that the platform filter works"""

    ocw_platform = mock_courses.ocw_course.platform
    mitx_platform = mock_courses.mitx_course.platform

    results = client.get(f"{RESOURCE_API_URL}?platform={ocw_platform.code}").json()[
        "results"
    ]
    assert len(results) == 1
    assert results[0]["readable_id"] == mock_courses.ocw_course.readable_id

    platform_filter = multifilter.format(ocw_platform.code, mitx_platform.code)
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


@pytest.mark.parametrize(
    "multifilter", ["resource_type={}&resource_type={}", "resource_type={},{}"]
)
def test_learning_resource_filter_resource_type(client, multifilter):
    """Test that the resource type filter works"""
    ProgramFactory.create()
    podcast = PodcastFactory.create().learning_resource
    learning_path = LearningPathFactory.create().learning_resource

    results = client.get(
        f"{RESOURCE_API_URL}?resource_type={LearningResourceType.podcast.name}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == podcast.id

    resource_filter = multifilter.format(
        LearningResourceType.podcast.name, LearningResourceType.learning_path.name
    )
    results = client.get(f"{RESOURCE_API_URL}?{resource_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [podcast.readable_id, learning_path.readable_id]
    )


@pytest.mark.parametrize("sortby", ["created_on", "readable_id", "id"])
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


@pytest.mark.parametrize("multifilter", ["topic={}&topic={}", "topic={},{}"])
def test_learning_resource_filter_topics(mock_courses, client, multifilter):
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

    topic_filter = multifilter.format(
        mock_courses.mitx_course.topics.first().name.lower(),
        mock_courses.ocw_course.topics.first().name.upper(),
    )
    results = client.get(f"{RESOURCE_API_URL}?{topic_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [mock_courses.mitx_course.readable_id, mock_courses.ocw_course.readable_id]
    )


@pytest.mark.parametrize(
    "multifilter", ["course_feature={}&course_feature={}", "course_feature={},{}"]
)
def test_learning_resource_filter_course_features(client, multifilter):
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

    feature_filter = multifilter.format("EXAMS", "lEcture nOtes")
    results = client.get(f"{RESOURCE_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["readable_id"] for result in results]) == sorted(
        [resource_with_exams.readable_id, resource_with_notes.readable_id]
    )


@pytest.mark.parametrize(
    "multifilter",
    [
        "level=high_school&level=graduate",
        "level=high_school,graduate",
        "level=high_school,graduate&level=graduate",
    ],
)
def test_learning_resource_filter_level(client, multifilter):
    """Test that the level filter works"""

    hs_run = LearningResourceRunFactory.create(level=["High School", "Undergraduate"])
    grad_run = LearningResourceRunFactory.create(level=["Undergraduate", "Graduate"])
    other_run = LearningResourceRunFactory.create(level=["Other"])

    LearningResourceRun.objects.exclude(
        id__in=[hs_run.id, grad_run.id, other_run.id]
    ).delete()

    results = client.get(f"{RESOURCE_API_URL}?level=high_school").json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == hs_run.learning_resource.id

    results = client.get(f"{RESOURCE_API_URL}?level=graduate").json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == grad_run.learning_resource.id

    results = client.get(f"{RESOURCE_API_URL}?{multifilter}").json()["results"]
    assert len(results) == 2


@pytest.mark.parametrize("multifilter", ["run_id={}&run_id={}", "run_id={},{}"])
def test_content_file_filter_run_id(mock_content_files, client, multifilter):
    """Test that the run_id filter works for contentfiles"""

    results = client.get(
        f"{CONTENT_API_URL}?run_id={mock_content_files[1].run.id}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_content_files[1].id

    feature_filter = multifilter.format(
        mock_content_files[0].run.id, mock_content_files[1].run.id
    )
    results = client.get(f"{CONTENT_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["run_id"] for result in results]) == sorted(
        [mock_content_files[0].run.id, mock_content_files[1].run.id]
    )


@pytest.mark.parametrize(
    "multifilter", ["resource_id={}&resource_id={}", "resource_id={},{}"]
)
def test_content_file_filter_resource_id(mock_content_files, client, multifilter):
    """Test that the resource_id filter works for contentfiles"""

    results = client.get(
        f"{CONTENT_API_URL}?resource_id={mock_content_files[1].run.learning_resource.id}"
    ).json()["results"]
    assert len(results) == 1
    assert (
        int(results[0]["resource_id"]) == mock_content_files[1].run.learning_resource.id
    )

    feature_filter = multifilter.format(
        mock_content_files[0].run.learning_resource.id,
        mock_content_files[1].run.learning_resource.id,
    )
    results = client.get(f"{CONTENT_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([int(result["resource_id"]) for result in results]) == sorted(
        [
            mock_content_files[0].run.learning_resource.id,
            mock_content_files[1].run.learning_resource.id,
        ]
    )


@pytest.mark.parametrize("multifilter", ["platform={}&platform={}", "platform={},{}"])
def test_content_file_filter_platform(mock_content_files, client, multifilter):
    """Test that the platform filter works"""

    results = client.get(
        f"{CONTENT_API_URL}?platform={mock_content_files[1].run.learning_resource.platform.code}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_content_files[1].id

    platform_filter = multifilter.format(
        mock_content_files[1].run.learning_resource.platform.code,
        mock_content_files[0].run.learning_resource.platform.code,
    )
    results = client.get(f"{CONTENT_API_URL}?{platform_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [cf.id for cf in mock_content_files[:2]]
    )


@pytest.mark.parametrize(
    "multifilter", ["offered_by={}&offered_by={}", "offered_by={},{}"]
)
def test_content_file_filter_offered_by(mock_content_files, client, multifilter):
    """Test that the offered_by filter works for contentfiles"""

    results = client.get(
        f"{CONTENT_API_URL}?offered_by={mock_content_files[1].run.learning_resource.offered_by.code}"
    ).json()["results"]
    assert len(results) == 1
    assert results[0]["id"] == mock_content_files[1].id

    offered_filter = multifilter.format(
        mock_content_files[1].run.learning_resource.offered_by.code,
        mock_content_files[0].run.learning_resource.offered_by.code,
    )
    results = client.get(f"{CONTENT_API_URL}?{offered_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [cf.id for cf in mock_content_files[:2]]
    )


@pytest.mark.parametrize(
    "multifilter",
    ["content_feature_type={}&content_feature_type={}", "content_feature_type={},{}"],
)
def test_learning_resource_filter_content_feature_type(client, multifilter):
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

    feature_filter = multifilter.format("EXAMS", "lEcture nOtes")
    results = client.get(f"{CONTENT_API_URL}?{feature_filter}").json()["results"]
    assert len(results) == 2
    assert sorted([result["id"] for result in results]) == sorted(
        [cf_with_exams.id, cf_with_notes.id]
    )
