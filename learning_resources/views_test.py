""" Test for learning_resources views"""
from rest_framework.reverse import reverse

from learning_resources.factories import CourseFactory, LearningResourceFactory


def test_list_course_endpoint(client):
    """Test courses endpoint"""
    course = CourseFactory.create()
    # this should be filtered out
    CourseFactory.create(
        learning_resource=LearningResourceFactory.create(published=False)
    )

    resp = client.get(reverse("lr_courses_api-list"))
    assert resp.data.get("count") == 1
    assert resp.data.get("results")[0]["id"] == course.learning_resource.id


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
