"""Tests for learning_resources serializers"""

import pytest

from learning_resources import factories, serializers
from learning_resources.models import LearningResource

pytestmark = pytest.mark.django_db


datetime_format = "%Y-%m-%dT%H:%M:%SZ"
datetime_millis_format = "%Y-%m-%dT%H:%M:%S.%fZ"


def test_serialize_course_model():
    """
    Verify that a serialized course contains attributes for related objects
    """
    course = factories.CourseFactory.create()
    serializer = serializers.LearningResourceSerializer(
        instance=course.learning_resource
    )
    assert len(serializer.data["topics"]) > 0
    assert "name" in serializer.data["topics"][0].keys()
    assert len(serializer.data["runs"]) == 2
    assert "run_id" in serializer.data["runs"][0].keys()
    assert serializer.data["image"]["url"] is not None
    assert len(serializer.data["offered_by"]) > 0
    assert serializer.data["offered_by"][0] in [
        o.value for o in factories.OfferedByChoice
    ]
    assert serializer.data["department"]["name"] is not None
    assert serializer.data["platform"] is not None
    assert (
        serializer.data["course"] == serializers.CourseSerializer(instance=course).data
    )
    assert serializer.data["course"]["extra_course_numbers"] is not None
    assert serializer.data["program"] is None


def test_serialize_dupe_model():
    """A dupe course should fail validation, a non-dupe course should pass"""
    course = factories.CourseFactory.create()
    serialized_data = serializers.LearningResourceSerializer(
        instance=course.learning_resource
    ).data
    serialized_data.pop("id")

    dupe_course_serializer = serializers.LearningResourceSerializer(
        data=serialized_data
    )
    assert not dupe_course_serializer.is_valid()

    serialized_data["readable_id"] = "new-unique-id"
    non_dupe_course_serializer = serializers.LearningResourceSerializer(
        data=serialized_data
    )
    assert non_dupe_course_serializer.is_valid(raise_exception=True)


def test_serialize_program_model():
    """
    Verify that a serialized program contains attributes for related objects
    """
    program = factories.ProgramFactory.create()
    serializer = serializers.LearningResourceSerializer(
        instance=program.learning_resource
    )
    assert len(serializer.data["topics"]) > 0
    assert "name" in serializer.data["topics"][0].keys()
    assert len(serializer.data["runs"]) == 1
    assert "run_id" in serializer.data["runs"][0].keys()
    assert serializer.data["image"]["url"] is not None
    assert len(serializer.data["offered_by"]) > 0
    assert serializer.data["offered_by"][0] in [
        o.value for o in factories.OfferedByChoice
    ]
    assert serializer.data["department"]["name"] is not None
    assert serializer.data["platform"] is not None
    assert serializer.data["prices"][0].replace(".", "").isnumeric()
    assert (
        serializer.data["program"]
        == serializers.ProgramSerializer(instance=program).data
    )
    assert serializer.data["program"]["courses"] is not None
    program_course_serializer = serializers.LearningResourceBaseSerializer(
        instance=LearningResource.objects.get(
            id=serializer.data["program"]["courses"][0]["id"]
        )
    )
    assert program_course_serializer.data == serializer.data["program"]["courses"][0]
    assert not program_course_serializer.data.get("runs", None)


def test_serialize_run_related_models():
    """
    Verify that a serialized  run contains attributes for related objects
    """
    run = factories.LearningResourceRunFactory()
    serializer = serializers.LearningResourceRunSerializer(run)
    assert len(serializer.data["prices"]) > 0
    assert serializer.data["prices"][0].replace(".", "").isnumeric()
    assert len(serializer.data["instructors"]) > 0
    for attr in ("first_name", "last_name", "full_name"):
        assert attr in serializer.data["instructors"][0].keys()
