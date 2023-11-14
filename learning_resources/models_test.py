"""Tests for learning_resources.models"""

import pytest

from learning_resources import constants
from learning_resources.constants import LearningResourceType
from learning_resources.factories import (
    CourseFactory,
    LearningResourceOfferorFactory,
    ProgramFactory,
)

pytestmark = [pytest.mark.django_db]


def test_program_creation():
    """Test that a program has associated LearningResource, run, topics, etc"""
    program = ProgramFactory.create()
    resource = program.learning_resource
    assert resource.title is not None
    assert resource.image.url is not None
    assert resource.resource_type == LearningResourceType.program.name
    assert resource.program == program
    assert program.courses.count() >= 1
    run = program.runs.first()
    assert run.start_date is not None
    assert run.image.url is not None
    assert len(run.prices) > 0
    assert run.instructors.count() > 0
    assert resource.topics.count() > 0
    assert resource.offered_by is not None
    assert resource.runs.count() == program.runs.count()


def test_course_creation():
    """Test that a course has associated LearningResource, runs, topics, etc"""
    course = CourseFactory.create()
    resource = course.learning_resource
    assert resource.resource_type == LearningResourceType.course.name
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
    assert resource.offered_by is not None
    assert resource.runs.count() == course.runs.count()


@pytest.mark.parametrize(
    ("offered_by", "availability", "has_cert"),
    [
        [  # noqa: PT007
            constants.OfferedBy.ocw.name,
            constants.AvailabilityType.archived.value,
            False,
        ],
        [  # noqa: PT007
            constants.OfferedBy.ocw.name,
            constants.AvailabilityType.current.value,
            False,
        ],
        [  # noqa: PT007
            constants.OfferedBy.xpro.name,
            constants.AvailabilityType.archived.value,
            True,
        ],
        [  # noqa: PT007
            constants.OfferedBy.xpro.name,
            constants.AvailabilityType.current.value,
            True,
        ],
        [  # noqa: PT007
            constants.OfferedBy.mitx.name,
            constants.AvailabilityType.archived.value,
            False,
        ],
        [  # noqa: PT007
            constants.OfferedBy.mitx.name,
            constants.AvailabilityType.current.value,
            True,
        ],
    ],
)
def test_lr_certification(offered_by, availability, has_cert):
    """The certification property should return the expected value"""
    offered_by = LearningResourceOfferorFactory.create(code=offered_by)

    course = CourseFactory.create(
        offered_by=offered_by.code,
        learning_resource__runs=[],
        is_professional=(has_cert and offered_by != constants.OfferedBy.mitx.value),
    )

    assert course.learning_resource.certification == (
        constants.CERTIFICATE if has_cert else None
    )
