""" Test for learning_resources views"""
import pytest
from rest_framework.reverse import reverse

from learning_resources.constants import LearningResourceType
from learning_resources.factories import (
    CourseFactory,
    LearningResourceFactory,
    LearningResourceRunFactory,
    ProgramFactory,
)
from learning_resources.views import CourseViewSet

pytestmark = [pytest.mark.django_db]


@pytest.mark.parametrize(
    "url, params",
    [
        ["lr_courses_api-list", ""],
        ["learning_resources_api-list", "resource_type=course"],
    ],
)
def test_list_course_endpoint(client, url, params):
    """Test courses endpoint"""
    courses = sorted(
        CourseFactory.create_batch(2), key=lambda course: course.learning_resource.id
    )
    # this should be filtered out
    CourseFactory.create_batch(5, is_unpublished=True)

    resp = client.get(f"{reverse(url)}?{params}")
    assert resp.data.get("count") == 2
    for idx, course in enumerate(courses):
        assert resp.data.get("results")[idx]["id"] == course.learning_resource.id


@pytest.mark.parametrize(
    "url", ["lr_courses_api-detail", "learning_resources_api-detail"]
)
def test_get_course_endpoint(client, url):
    """Test course detail endpoint"""
    course = CourseFactory.create()

    resp = client.get(reverse(url, args=[course.learning_resource.id]))

    assert resp.data.get("readable_id") == course.learning_resource.readable_id


@pytest.mark.parametrize(
    "url, params",
    [
        ["lr_courses_api-list", ""],
        ["learning_resources_api-list", "resource_type=course"],
    ],
)
def test_new_courses_endpoint(client, url, params):
    """Test new courses endpoint"""
    courses = sorted(
        CourseFactory.create_batch(3),
        key=lambda course: course.learning_resource.created_on,
        reverse=True,
    )

    resp = client.get(f"{reverse(url)}new/?{params}")
    assert resp.data.get("count") == 3
    for i in range(3):
        assert resp.data.get("results")[i]["id"] == courses[i].learning_resource.id


@pytest.mark.parametrize(
    "url, params",
    [
        ["lr_courses_api-list", ""],
        ["learning_resources_api-list", "resource_type=course"],
    ],
)
def test_upcoming_courses_endpoint(client, url, params):
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

    resp = client.get(f"{reverse(url)}upcoming/?{params}")
    assert resp.data.get("count") == 1
    assert resp.data.get("results")[0]["id"] == upcoming_course.learning_resource.id


@pytest.mark.parametrize(
    "url, params",
    [
        ["lr_programs_api-list", ""],
        ["learning_resources_api-list", "resource_type=program"],
    ],
)
def test_program_endpoint(client, url, params):
    """Test program endpoint"""
    programs = ProgramFactory.create_batch(3)

    resp = client.get(f"{reverse(url)}?{params}")
    for i in range(3):
        assert resp.data.get("results")[i]["id"] == programs[i].learning_resource.id


@pytest.mark.parametrize(
    "url", ["lr_programs_api-detail", "learning_resources_api-detail"]
)
def test_program_detail_endpoint(client, url):
    """Test program endpoint"""
    program = ProgramFactory.create()
    resp = client.get(reverse(url, args=[program.learning_resource.id]))
    assert resp.data.get("title") == program.learning_resource.title
    assert resp.data.get("resource_type") == LearningResourceType.program.value
    response_courses = sorted(resp.data["program"]["courses"], key=lambda i: i["id"])

    courses = sorted(
        [relation.child for relation in program.courses.all()], key=lambda lr: lr.id
    )
    assert len(response_courses) == len(courses)
    assert [course.id for course in courses] == [
        course["id"] for course in response_courses
    ]
    for idx, course in enumerate(courses):
        assert course.id == response_courses[idx]["id"]
        assert (
            response_courses[idx]["resource_type"] == LearningResourceType.course.value
        )


def test_list_resources_endpoint(client):
    """Test unfiltered learning_resources endpoint"""
    courses = CourseFactory.create_batch(5)
    programs = ProgramFactory.create_batch(5)
    resource_ids = [resource.learning_resource.id for resource in [*courses, *programs]]
    resource_ids.extend(
        [
            course.child.id
            for sublist in [program.courses.all() for program in programs]
            for course in sublist
        ]
    )

    # this should be filtered out
    CourseFactory.create(is_unpublished=True)

    resp = client.get(reverse("learning_resources_api-list"))
    assert resp.data.get("count") == len(set(resource_ids))
    for result in resp.data["results"]:
        assert result["id"] in resource_ids


@pytest.mark.parametrize("course_count", [1, 5, 10])
def test_no_excess_queries(mocker, django_assert_num_queries, course_count):
    """
    There should only be 8 queries made (based on number of related models),
    regardless of number of results returned.
    """
    CourseFactory.create_batch(course_count)

    with django_assert_num_queries(8):
        view = CourseViewSet(request=mocker.Mock(query_params=[]))
        results = view.get_queryset().all()
        assert len(results) == course_count
