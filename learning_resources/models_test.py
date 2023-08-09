"""Tests for learning_resources.models"""
import pytest

from learning_resources.constants import LearningResourceType
from learning_resources.factories import CourseFactory, ProgramFactory


@pytest.mark.django_db
def test_program_creation():
    """Test that a program has associated LearningResource, run, topics, etc"""
    program = ProgramFactory.create()
    resource = program.learning_resource
    assert resource.title is not None
    assert resource.image.url is not None
    assert resource.resource_type == LearningResourceType.program.value
    assert resource.program == program
    run = program.runs.first()
    assert run.start_date is not None
    assert run.image.url is not None
    assert run.prices.count() > 0
    assert run.instructors.count() > 0
    assert resource.topics.count() > 0
    assert resource.offered_by.count() > 0
    assert resource.runs.count() == program.runs.count()


@pytest.mark.django_db
def test_course_creation():
    """Test that a course has associated LearningResource, runs, topics, etc"""
    course = CourseFactory.create()
    resource = course.learning_resource
    assert resource.resource_type == LearningResourceType.course.value
    assert resource.title is not None
    assert resource.image.url is not None
    assert resource.course == course
    run = course.runs.first()
    assert run.start_date is not None
    assert run.image.url is not None
    assert run.prices.count() > 0
    assert run.instructors.count() > 0
    assert resource.topics.count() > 0
    assert resource.offered_by.count() > 0
    assert resource.runs.count() == course.runs.count()
