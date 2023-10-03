"""Tests for Course Catalog Filters"""
import pytest

from learning_resources.constants import (
    OPEN,
    PROFESSIONAL,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.factories import (
    CourseFactory,
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
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


@pytest.mark.parametrize("is_open", [True, False])
def test_learning_resource_filter_audience(is_open):
    """Test that the audience filter works"""

    professional_course = CourseFactory.create(
        platform=LearningResourcePlatformFactory.create(
            platform=PlatformType.xpro.value, audience=PROFESSIONAL
        )
    ).learning_resource
    open_course = CourseFactory.create(
        platform=LearningResourcePlatformFactory.create(
            platform=PlatformType.ocw.value, audience=OPEN
        )
    ).learning_resource

    query = LearningResourceFilter(
        {"audience": ("open" if is_open else "professional")}
    ).qs

    assert (professional_course not in query) is is_open
    assert (open_course in query) is is_open


def test_learning_resource_filter_resource_type():
    """Test that the resource type filter works"""

    course = CourseFactory.create().learning_resource
    podcast = PodcastFactory.create().learning_resource

    query = LearningResourceFilter(
        {"resource_type": LearningResourceType.podcast.value}
    ).qs

    assert podcast in query
    assert course not in query
