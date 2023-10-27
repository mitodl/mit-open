"""Tests for learning_resources Filters"""
from types import SimpleNamespace

import pytest

from learning_resources.constants import (
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.factories import (
    CourseFactory,
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
