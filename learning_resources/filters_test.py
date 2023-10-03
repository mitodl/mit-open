"""Tests for Course Catalog Filters"""
import pytest

from learning_resources.constants import (
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.factories import (
    CourseFactory,
    LearningResourceOfferorFactory,
    PodcastFactory,
)
from learning_resources.filters import LearningResourceFilter

pytestmark = pytest.mark.django_db


def test_learning_resource_filter_offered_by():
    """Test that the offered_by filter works"""
    ocw = LearningResourceOfferorFactory.create(is_ocw=True)
    mitx = LearningResourceOfferorFactory.create(is_mitx=True)

    ocw_course = CourseFactory.create().learning_resource
    mitx_course = CourseFactory.create().learning_resource

    ocw_course.offered_by = ocw
    ocw_course.save()
    mitx_course.offered_by = mitx
    mitx_course.save()

    query = LearningResourceFilter({"offered_by": OfferedBy.ocw.name}).qs

    assert ocw_course in query
    assert mitx_course not in query


def test_learning_resource_filter_platform():
    """Test that the platform filter works"""

    ocw_course = CourseFactory.create(platform=PlatformType.ocw.value).learning_resource
    mitx_course = CourseFactory.create(
        platform=PlatformType.mitxonline.value
    ).learning_resource

    query = LearningResourceFilter({"platform": PlatformType.ocw.value}).qs

    assert ocw_course in query
    assert mitx_course not in query


@pytest.mark.parametrize("is_professional", [True, False])
def test_learning_resource_filter_professional(is_professional):
    """Test that the professional filter works"""

    professional_course = CourseFactory.create(
        platform=PlatformType.xpro.value, is_professional=True
    ).learning_resource
    open_course = CourseFactory.create(
        platform=PlatformType.xpro.value
    ).learning_resource

    assert professional_course.is_professional is True
    assert open_course.is_professional is False

    query = LearningResourceFilter({"professional": is_professional}).qs

    assert (professional_course in query) is is_professional
    assert (open_course in query) is not is_professional


def test_learning_resource_filter_resource_type():
    """Test that the resource type filter works"""

    course = CourseFactory.create().learning_resource
    podcast = PodcastFactory.create().learning_resource

    query = LearningResourceFilter(
        {"resource_type": LearningResourceType.podcast.value}
    ).qs

    assert podcast in query
    assert course not in query
