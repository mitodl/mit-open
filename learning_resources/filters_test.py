"""Tests for learning_resources Filters"""

from types import SimpleNamespace

import pytest

from learning_resources.constants import (
    LEARNING_RESOURCE_SORTBY_OPTIONS,
    LearningResourceType,
    LevelType,
    OfferedBy,
    PlatformType,
)
from learning_resources.factories import (
    CourseFactory,
    LearningResourceContentTagFactory,
    LearningResourceFactory,
    LearningResourceRunFactory,
    PodcastFactory,
)
from learning_resources.filters import LearningResourceFilter

pytestmark = pytest.mark.django_db


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

    return SimpleNamespace(
        ocw_course=ocw_course,
        mitx_course=mitx_course,
    )


def test_learning_resource_filter_department(mock_courses):
    """Test that the department_id filter works"""
    ocw_department_id = mock_courses.ocw_course.departments.first().department_id

    query = LearningResourceFilter({"department": ocw_department_id}).qs
    assert query.count() == 1

    assert mock_courses.ocw_course in query
    assert mock_courses.mitx_course not in query


def test_learning_resource_filter_offered_by(mock_courses):
    """Test that the offered_by filter works"""

    query = LearningResourceFilter({"offered_by": OfferedBy.ocw.name}).qs

    assert mock_courses.ocw_course in query
    assert mock_courses.mitx_course not in query


def test_learning_resource_filter_platform(mock_courses):
    """Test that the platform filter works"""

    query = LearningResourceFilter({"platform": PlatformType.ocw.name}).qs

    assert mock_courses.ocw_course in query
    assert mock_courses.mitx_course not in query


@pytest.mark.parametrize("is_professional", [True, False])
def test_learning_resource_filter_professional(is_professional):
    """Test that the professional filter works"""

    professional_course = CourseFactory.create(
        platform=PlatformType.xpro.name, is_professional=True
    ).learning_resource
    open_course = CourseFactory.create(
        platform=PlatformType.xpro.name
    ).learning_resource

    assert professional_course.professional is True
    assert open_course.professional is False

    query = LearningResourceFilter({"professional": is_professional}).qs

    assert (professional_course in query) is is_professional
    assert (open_course in query) is not is_professional


def test_learning_resource_filter_resource_type():
    """Test that the resource type filter works"""

    course = CourseFactory.create().learning_resource
    podcast = PodcastFactory.create().learning_resource

    query = LearningResourceFilter(
        {"resource_type": LearningResourceType.podcast.name}
    ).qs

    assert podcast in query
    assert course not in query


@pytest.mark.parametrize("sortby", ["created_on", "readable_id", "id"])
@pytest.mark.parametrize("descending", [True, False])
def test_learning_resource_sortby(sortby, descending):
    """Test that the query is sorted in the correct order"""
    resources = [course.learning_resource for course in CourseFactory.create_batch(3)]
    sortby_param = sortby
    if descending:
        sortby_param = f"-{sortby}"
    query = LearningResourceFilter(
        {
            "resource_type": LearningResourceType.course.name,
            "sortby": sortby_param,
        }
    ).qs
    assert list(query.values_list("id", flat=True)) == sorted(
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


def test_learning_resource_filter_topics():
    """Test that the topic filter works"""
    resource_1, resource_2 = (
        course.learning_resource for course in CourseFactory.create_batch(2)
    )
    assert (
        list(
            set(resource_1.topics.all().values_list("name", flat=True))
            & set(resource_2.topics.all().values_list("name", flat=True))
        )
        == []
    )

    query = LearningResourceFilter({"topic": resource_1.topics.first().name.upper()}).qs

    assert resource_1 in query
    assert resource_2 not in query


def test_learning_resource_filter_tags():
    """Test that the resource_content_tag filter works"""

    resource_with_exams = LearningResourceFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(1, name="Exams")
    )
    resource_with_notes = LearningResourceFactory.create(
        content_tags=LearningResourceContentTagFactory.create_batch(
            1, name="Lecture Notes"
        )
    )

    query = LearningResourceFilter({"content_tags": "ExamS"}).qs

    assert resource_with_exams in query
    assert resource_with_notes not in query


def test_learning_resource_filter_level():
    """Test that the level filter works"""

    hs_run = LearningResourceRunFactory.create(level=["High School", "Undergraduate"])
    grad_run = LearningResourceRunFactory.create(level=["Undergraduate", "Graduate"])
    hs_resource = hs_run.learning_resource
    grad_resource = grad_run.learning_resource

    hs_resource.runs.set([hs_run])
    grad_resource.runs.set([grad_run])

    query = LearningResourceFilter({"level": LevelType.high_school.name}).qs

    assert hs_resource in query
    assert grad_resource not in query

    query = LearningResourceFilter({"level": LevelType.graduate.name}).qs

    assert hs_resource not in query
    assert grad_resource in query
