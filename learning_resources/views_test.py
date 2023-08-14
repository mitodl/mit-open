""" Test for learning_resources views"""
from rest_framework.reverse import reverse

from learning_resources.constants import LearningResourceType
from learning_resources.factories import (
    CourseFactory,
    LearningResourceFactory,
    LearningResourceRunFactory,
    ProgramFactory,
)


def test_list_course_endpoint(client):
    """Test courses endpoint"""
    courses = sorted(
        CourseFactory.create_batch(2), key=lambda course: course.learning_resource.id
    )
    # this should be filtered out
    CourseFactory.create_batch(5, is_unpublished=True)

    resp = client.get(reverse("lr_courses_api-list"))
    assert resp.data.get("count") == 2
    for idx, course in enumerate(courses):
        assert resp.data.get("results")[idx]["id"] == course.learning_resource.id


def test_get_course_endpoint(client):
    """Test course detail endpoint"""
    course = CourseFactory.create()

    resp = client.get(
        reverse("lr_courses_api-detail", args=[course.learning_resource.id])
    )

    assert resp.data.get("readable_id") == course.learning_resource.readable_id


def test_new_courses_endpoint(client):
    """Test new courses endpoint"""
    courses = sorted(
        CourseFactory.create_batch(3),
        key=lambda course: course.learning_resource.created_on,
        reverse=True,
    )

    resp = client.get(reverse("lr_courses_api-list") + "new/")

    assert resp.data.get("count") == 3
    for i in range(3):
        assert resp.data.get("results")[i]["id"] == courses[i].learning_resource.id


def test_upcoming_courses_endpoint(client):
    """Test new courses endpoint"""
    upcoming_course = CourseFactory.create(
        learning_resource=LearningResourceFactory.create(is_course=True), runs=[]
    )
    LearningResourceRunFactory.create(
        learning_resource=upcoming_course.learning_resource, in_future=True
    )

    past_course = CourseFactory.create(
        learning_resource=LearningResourceFactory.create(is_course=True), runs=[]
    )
    LearningResourceRunFactory.create(
        learning_resource=past_course.learning_resource, in_past=True
    )

    resp = client.get(reverse("lr_courses_api-list") + "upcoming/")

    assert resp.data.get("count") == 1
    assert resp.data.get("results")[0]["id"] == upcoming_course.learning_resource.id


def test_program_endpoint(client):
    """Test program endpoint"""
    programs = ProgramFactory.create_batch(3)

    resp = client.get(reverse("lr_programs_api-list"))
    for i in range(3):
        assert resp.data.get("results")[i]["id"] == programs[i].learning_resource.id


def test_program_detail_endpoint(client):
    """Test program endpoint"""
    program = ProgramFactory.create()
    courses = sorted(program.courses.all(), key=lambda lr: lr.id)
    resp = client.get(
        reverse("lr_programs_api-detail", args=[program.learning_resource.id])
    )
    assert resp.data.get("title") == program.learning_resource.title
    assert resp.data.get("resource_type") == LearningResourceType.program.value
    response_courses = sorted(resp.data["program"]["courses"], key=lambda i: i["id"])
    assert len(response_courses) == len(courses)
    for idx, course in enumerate(courses):
        assert course.id == response_courses[idx]["id"]
        assert (
            response_courses[idx]["resource_type"] == LearningResourceType.course.value
        )
