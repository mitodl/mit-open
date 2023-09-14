"""Tests for opensearch serializers"""


import pytest

from learning_resources import factories
from learning_resources.models import Course, Program
from learning_resources.serializers import LearningResourceSerializer
from learning_resources_search import api, serializers


@pytest.mark.django_db()
def test_serialize_bulk_courses(mocker):
    """
    Test that serialize_bulk_courses calls serialize_course_for_bulk for every existing course
    """
    mock_serialize_course = mocker.patch(
        "learning_resources_search.serializers.serialize_course_for_bulk"
    )
    courses = factories.CourseFactory.create_batch(5)
    list(
        serializers.serialize_bulk_courses(
            [course.learning_resource_id for course in Course.objects.all()]
        )
    )
    for course in courses:
        mock_serialize_course.assert_any_call(course)


@pytest.mark.django_db()
def test_serialize_course_for_bulk():
    """
    Test that serialize_course_for_bulk yields a valid LearningResourceSerializer
    """
    course = factories.CourseFactory.create()
    assert serializers.serialize_course_for_bulk(course) == {
        "_id": api.gen_course_id(
            course.learning_resource.platform, course.learning_resource.readable_id
        ),
        **LearningResourceSerializer(course.learning_resource).data,
    }


@pytest.mark.django_db()
def test_serialize_bulk_programs(mocker):
    """
    Test that serialize_bulk_programs calls serialize_program_for_bulk for every existing course
    """
    mock_serialize_program = mocker.patch(
        "learning_resources_search.serializers.serialize_program_for_bulk"
    )
    programs = factories.ProgramFactory.create_batch(5)
    list(
        serializers.serialize_bulk_programs(
            [program.learning_resource_id for program in Program.objects.all()]
        )
    )
    for program in programs:
        mock_serialize_program.assert_any_call(program)


@pytest.mark.django_db()
def test_serialize_program_for_bulk():
    """
    Test that serialize_program_for_bulk yields a valid LearningResourceSerializer
    """
    program = factories.ProgramFactory.create()
    assert serializers.serialize_program_for_bulk(program) == {
        "_id": api.gen_program_id(program),
        **LearningResourceSerializer(program.learning_resource).data,
    }


@pytest.mark.django_db()
def test_serialize_bulk_courses_for_deletion():
    """
    Test that serialize_bulk_courses_for_deletion yields correct data
    """
    course = factories.CourseFactory.create()
    assert list(
        serializers.serialize_bulk_courses_for_deletion([course.learning_resource_id])
    ) == [
        {
            "_id": api.gen_course_id(
                course.learning_resource.platform, course.learning_resource.readable_id
            ),
            "_op_type": "delete",
        }
    ]


@pytest.mark.django_db()
def test_serialize_bulk_programs_for_deletion():
    """
    Test that serialize_bulk_programs_for_deletion yields correct data
    """
    program = factories.ProgramFactory.create()
    assert list(
        serializers.serialize_bulk_programs_for_deletion([program.learning_resource_id])
    ) == [{"_id": api.gen_program_id(program), "_op_type": "delete"}]
