"""Tests for learning_resources.models"""
import pytest

from learning_resources import constants
from learning_resources.constants import LearningResourceType
from learning_resources.factories import (
    CourseFactory,
    LearningResourceFactory,
    LearningResourcePlatformFactory,
    LearningResourceRunFactory,
    ProgramFactory,
)

pytestmark = [pytest.mark.django_db]


def test_program_creation():
    """Test that a program has associated LearningResource, run, topics, etc"""
    program = ProgramFactory.create()
    resource = program.learning_resource
    assert resource.title is not None
    assert resource.image.url is not None
    assert resource.resource_type == LearningResourceType.program.value
    assert resource.program == program
    assert program.courses.count() >= 1
    run = program.runs.first()
    assert run.start_date is not None
    assert run.image.url is not None
    assert len(run.prices) > 0
    assert run.instructors.count() > 0
    assert resource.topics.count() > 0
    assert resource.offered_by.count() > 0
    assert resource.runs.count() == program.runs.count()


def test_course_creation():
    """Test that a course has associated LearningResource, runs, topics, etc"""
    course = CourseFactory.create()
    resource = course.learning_resource
    assert resource.resource_type == LearningResourceType.course.value
    assert resource.title is not None
    assert resource.image.url is not None
    assert 0 <= len(resource.prices) <= 3
    assert resource.course == course
    run = resource.runs.first()
    assert run.start_date is not None
    assert run.image.url is not None
    assert len(run.prices) > 0
    assert run.instructors.count() > 0
    assert resource.topics.count() > 0
    assert resource.offered_by.count() > 0
    assert resource.runs.count() == course.runs.count()


@pytest.mark.parametrize(
    "platform", [constants.PlatformType.ocw.value, constants.PlatformType.mitx.value]
)
@pytest.mark.parametrize("audience", [constants.OPEN, constants.PROFESSIONAL])
def test_lr_audience(platform, audience):
    """The audience property should return the expected value"""
    lr = LearningResourceFactory.create(
        platform=LearningResourcePlatformFactory.create(
            platform=platform, audience=audience
        )
    )
    assert lr.audience == lr.platform.audience


@pytest.mark.parametrize(
    ("platform", "audience", "availability", "has_cert"),
    [
        [  # noqa: PT007
            constants.PlatformType.ocw.value,
            constants.PROFESSIONAL,
            constants.AvailabilityType.archived.value,
            True,
        ],
        [  # noqa: PT007
            constants.PlatformType.ocw.value,
            constants.OPEN,
            constants.AvailabilityType.archived.value,
            False,
        ],

        [  # noqa: PT007
            constants.PlatformType.mitx.value,
            constants.PROFESSIONAL,
            constants.AvailabilityType.archived.value,
            True,
        ],
        [
            constants.PlatformType.mitx.value,
            constants.OPEN,
            constants.AvailabilityType.archived.value,
            False,
        ],
        [  # noqa: PT007
            constants.PlatformType.mitx.value,
            constants.OPEN,
            constants.AvailabilityType.current.value,
            True,
        ],
    ],
)
def test_lr_certification(platform, audience, availability, has_cert):
    """The certification property should return the expected value"""
    platform_object = LearningResourcePlatformFactory.create(
        platform=platform, audience=audience
    )

    course = CourseFactory.create(
        platform=platform_object,
        runs=[],
    )
    course.learning_resource.runs.set(
        [LearningResourceRunFactory.create(availability=availability)]
    )
    assert course.learning_resource.certification == (
        constants.CERTIFICATE if has_cert else None
    )
