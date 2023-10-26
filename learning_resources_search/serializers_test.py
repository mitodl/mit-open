"""Tests for opensearch serializers"""


import pytest
from django.http import QueryDict
from rest_framework.renderers import JSONRenderer

from learning_resources import factories
from learning_resources.models import Course, Program
from learning_resources.serializers import LearningResourceSerializer
from learning_resources_search import serializers
from learning_resources_search.serializers import (
    LearningResourcesSearchRequestSerializer,
    LearningResourcesSearchResponseSerializer,
    extract_values,
)


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
        mock_serialize_course.assert_any_call(course.learning_resource)


@pytest.mark.django_db()
def test_serialize_course_for_bulk():
    """
    Test that serialize_course_for_bulk yields a valid LearningResourceSerializer
    """
    course = factories.CourseFactory.create()
    assert serializers.serialize_course_for_bulk(course.learning_resource) == {
        "_id": course.learning_resource.id,
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
        mock_serialize_program.assert_any_call(program.learning_resource)


@pytest.mark.django_db()
def test_serialize_program_for_bulk():
    """
    Test that serialize_program_for_bulk yields a valid LearningResourceSerializer
    """
    program = factories.ProgramFactory.create()
    assert serializers.serialize_program_for_bulk(program.learning_resource) == {
        "_id": program.learning_resource.id,
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
            "_id": course.learning_resource.id,
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
    ) == [{"_id": program.learning_resource.id, "_op_type": "delete"}]


def test_extract_values():
    """
    extract_values should return the correct match from a dict
    """
    test_json = {
        "a": {"b": {"c": [{"d": [1, 2, 3]}, {"d": [4, 5], "e": "f", "b": "g"}]}}
    }
    assert extract_values(test_json, "b") == [test_json["a"]["b"], "g"]
    assert extract_values(test_json, "d") == [[1, 2, 3], [4, 5]]
    assert extract_values(test_json, "e") == ["f"]


def test_learning_resources_search_request_serializer():
    data = {
        "q": "text",
        "offset": 1,
        "limit": 1,
        "sortby": "-runs.start_date",
        "resource_type": "course,program",
        "professional": "true",
        "certification": "Certificates",
        "offered_by": "xpro,ocw",
        "platform": "xpro,edx,ocw",
        "topic": "Math",
        "department": "mathematics,chemistry",
        "level": "Undergraduate",
        "resource_content_tags": "Lecture Videos",
        "aggregations": "resource_type,platform,level",
        "extra_field": "ignored",
    }

    cleaned = {
        "q": "text",
        "offset": 1,
        "limit": 1,
        "sortby": "-runs.start_date",
        "resource_type": ["course", "program"],
        "professional": ["true"],
        "certification": ["Certificates"],
        "offered_by": ["xpro", "ocw"],
        "platform": ["xpro", "edx", "ocw"],
        "topic": ["Math"],
        "department": ["mathematics", "chemistry"],
        "level": ["Undergraduate"],
        "resource_content_tags": ["Lecture Videos"],
        "aggregations": ["resource_type", "platform", "level"],
    }

    request_data = QueryDict("", mutable=True)
    request_data.update(data)

    serialized = LearningResourcesSearchRequestSerializer(data=request_data)
    assert serialized.is_valid() is True
    assert serialized.data == cleaned


@pytest.mark.parametrize(
    ("parameter", "value"),
    [
        ("resource_type", "course,program,spaceship"),
        ("platform", "xpro,spaceship"),
        ("offered_by", "spaceship"),
        ("aggregations", "spaceship"),
    ],
)
def test_learning_resources_search_request_serializer_invalid(parameter, value):
    data = {
        parameter: value,
    }

    request_data = QueryDict("", mutable=True)
    request_data.update(data)

    serialized = LearningResourcesSearchRequestSerializer(data=request_data)
    assert serialized.is_valid() is False
    assert JSONRenderer().render(serialized.errors) == JSONRenderer().render(
        {parameter: ["spaceship is not a valid option"]}
    )


def test_learning_resources_search_response_serializer(settings):
    settings.OPENSEARCH_MAX_SUGGEST_HITS = 10

    raw_data = {
        "took": 8,
        "timed_out": False,
        "_shards": {"total": 2, "successful": 2, "skipped": 0, "failed": 0},
        "hits": {
            "total": {"value": 9, "relation": "eq"},
            "max_score": 6.654978,
            "hits": [
                {
                    "_index": "discussions_local_course_6561cf5547d74a3aad746efb5f40a26d",
                    "_type": "_doc",
                    "_id": "co_globalalumni_Y291cnNlLXYxOnhQUk8rTUNQTytSMQ",
                    "_score": 6.654978,
                    "_source": {
                        "id": 5147,
                        "topics": [
                            {"id": 5, "name": "Management"},
                            {"id": 6, "name": "Innovation"},
                        ],
                        "offered_by": "xPRO",
                        "resource_content_tags": [],
                        "department": None,
                        "professional": True,
                        "certification": "Certificates",
                        "prices": [2250.0],
                        "course": {"extra_course_numbers": None},
                        "learning_path": None,
                        "podcast": None,
                        "podcast_episode": None,
                        "runs": [
                            {
                                "id": 633,
                                "instructors": [],
                                "image": None,
                                "run_id": "course-v1:xPRO+MCPO+R1",
                                "title": "Project Management: Leading Organizations to Success",
                                "description": None,
                                "full_description": None,
                                "last_modified": None,
                                "published": True,
                                "languages": None,
                                "url": None,
                                "level": None,
                                "slug": None,
                                "availability": None,
                                "semester": None,
                                "year": None,
                                "start_date": "2023-09-26T06:00:00Z",
                                "end_date": None,
                                "enrollment_start": None,
                                "enrollment_end": None,
                                "prices": ["2250.00"],
                                "checksum": None,
                            }
                        ],
                        "image": {
                            "id": 16,
                            "url": "https://xpro-app-production.s3.amazonaws.com/original_images/MCPO-800x500.jpg",
                            "description": None,
                            "alt": None,
                        },
                        "learning_path_parents": [],
                        "user_list_parents": [],
                        "program": None,
                        "readable_id": "course-v1:xPRO+MCPO+R1",
                        "title": "Managing Complex Projects and Organizations for Success",
                        "description": "",
                        "full_description": None,
                        "last_modified": None,
                        "published": True,
                        "languages": None,
                        "url": "http://xpro.mit.edu/courses/course-v1:xPRO+MCPO+R1/",
                        "resource_type": "course",
                        "platform": "globalalumni",
                    },
                }
            ],
        },
        "aggregations": {
            "level": {
                "doc_count": 9,
                "level": {
                    "doc_count": 20,
                    "level": {
                        "doc_count_error_upper_bound": 0,
                        "sum_other_doc_count": 0,
                        "buckets": [],
                    },
                },
            },
            "offered_by": {
                "doc_count": 9,
                "offered_by": {
                    "doc_count_error_upper_bound": 0,
                    "sum_other_doc_count": 0,
                    "buckets": [{"key": "xPRO", "doc_count": 9}],
                },
            },
        },
        "suggest": {
            "description.trigram": [
                {
                    "text": "manage",
                    "offset": 0,
                    "length": 6,
                    "options": [
                        {"text": "manage", "score": 0.05196008, "collate_match": True},
                        {
                            "text": "managers",
                            "score": 0.02764452,
                            "collate_match": True,
                        },
                    ],
                }
            ],
            "title.trigram": [
                {
                    "text": "manage",
                    "offset": 0,
                    "length": 6,
                    "options": [
                        {"text": "manage", "score": 0.073289275, "collate_match": False}
                    ],
                }
            ],
        },
    }
    response = {
        "count": 9,
        "results": [
            {
                "id": 5147,
                "topics": [
                    {"id": 5, "name": "Management"},
                    {"id": 6, "name": "Innovation"},
                ],
                "offered_by": "xPRO",
                "resource_content_tags": [],
                "department": None,
                "professional": True,
                "certification": "Certificates",
                "prices": [2250.0],
                "course": {"extra_course_numbers": None},
                "learning_path": None,
                "podcast": None,
                "podcast_episode": None,
                "runs": [
                    {
                        "id": 633,
                        "instructors": [],
                        "image": None,
                        "run_id": "course-v1:xPRO+MCPO+R1",
                        "title": "Project Management: Leading Organizations to Success",
                        "description": None,
                        "full_description": None,
                        "last_modified": None,
                        "published": True,
                        "languages": None,
                        "url": None,
                        "level": None,
                        "slug": None,
                        "availability": None,
                        "semester": None,
                        "year": None,
                        "start_date": "2023-09-26T06:00:00Z",
                        "end_date": None,
                        "enrollment_start": None,
                        "enrollment_end": None,
                        "prices": ["2250.00"],
                        "checksum": None,
                    }
                ],
                "image": {
                    "id": 16,
                    "url": "https://xpro-app-production.s3.amazonaws.com/original_images/MCPO-800x500.jpg",
                    "description": None,
                    "alt": None,
                },
                "learning_path_parents": [],
                "user_list_parents": [],
                "program": None,
                "readable_id": "course-v1:xPRO+MCPO+R1",
                "title": "Managing Complex Projects and Organizations for Success",
                "description": "",
                "full_description": None,
                "last_modified": None,
                "published": True,
                "languages": None,
                "url": "http://xpro.mit.edu/courses/course-v1:xPRO+MCPO+R1/",
                "resource_type": "course",
                "platform": "globalalumni",
            }
        ],
        "metadata": {
            "aggregations": {
                "level": [],
                "offered_by": [{"key": "xPRO", "doc_count": 9}],
            },
            "suggest": ["manage"],
        },
    }

    assert JSONRenderer().render(
        LearningResourcesSearchResponseSerializer(raw_data).data
    ) == JSONRenderer().render(response)
