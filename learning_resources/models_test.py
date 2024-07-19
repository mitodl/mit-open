"""Tests for learning_resources.models"""

import pytest

from learning_resources.constants import LearningResourceType
from learning_resources.factories import (
    CourseFactory,
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
    assert resource.prices == []


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
    assert resource.prices == []
