"""Tests for learning_resources.models"""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.admin.utils import flatten
from django.db.models import F

from learning_resources.constants import LearningResourceType
from learning_resources.factories import (
    CourseFactory,
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
    assert resource.prices == resource.next_run.prices


def test_course_prices_current_no_next():
    """Test that course.prices == published run prices if no next run"""
    course = CourseFactory.create()
    resource = course.learning_resource
    resource.runs.update(start_date=F("start_date") - timedelta(days=3650))
    unpub_run = LearningResourceRunFactory.create(
        learning_resource=resource, published=False, prices=[Decimal("987654.32")]
    )
    resource.refresh_from_db()
    assert resource.next_run is None
    # Prices should be from any published run if no next run
    assert resource.prices == sorted(
        set(flatten([run.prices for run in resource.runs.filter(published=True)]))
    )
    assert len(resource.prices) > 0
    assert unpub_run.prices[0] not in resource.prices


def test_course_prices_unpublished_runs():
    """Test that course.prices == [] if no published run"""
    course = CourseFactory.create()
    resource = course.learning_resource
    resource.runs.update(published=False)
    resource.refresh_from_db()
    assert resource.next_run is None
    assert resource.prices == []
