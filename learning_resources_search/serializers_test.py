"""Tests for opensearch serializers"""

from types import SimpleNamespace

import pytest
from django.http import QueryDict
from django.urls import reverse
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from learning_resources import factories
from learning_resources.constants import DEPARTMENTS, LearningResourceType
from learning_resources.etl.constants import CourseNumberType
from learning_resources.models import LearningResource
from learning_resources.serializers import LearningResourceSerializer
from learning_resources_search import serializers
from learning_resources_search.api import gen_content_file_id
from learning_resources_search.factories import PercolateQueryFactory
from learning_resources_search.serializers import (
    ContentFileSearchRequestSerializer,
    ContentFileSerializer,
    LearningResourcesSearchRequestSerializer,
    SearchResponseSerializer,
    extract_values,
    serialize_percolate_query,
)


@pytest.fixture()
def learning_resources_search_view():
    """Fixture with relevant properties for testing the search view"""
    return SimpleNamespace(url=reverse("lr_search:v1:learning_resources_search"))


def get_request_object(url):
    """Build and return a django request object"""
    request_factory = APIRequestFactory()
    api_request = request_factory.get(url, {"q": "test"})
    return Request(api_request)


@pytest.mark.django_db()
def test_serialize_bulk_learning_resources(mocker):
    """
    Test that serialize_bulk_learning_resource calls serialize_learning_resource_for_bulk for
    every existing learning resource
    """
    mock_serialize_program = mocker.patch(
        "learning_resources_search.serializers.serialize_learning_resource_for_bulk"
    )
    resources = factories.LearningResourceFactory.create_batch(5)
    list(
        serializers.serialize_bulk_learning_resources(
            [resource.id for resource in LearningResource.objects.all()]
        )
    )
    for resource in resources:
        mock_serialize_program.assert_any_call(resource)


@pytest.mark.django_db()
@pytest.mark.parametrize(
    "resource_type",
    set(LearningResourceType.names()) - {LearningResourceType.course.name},
)
def test_serialize_learning_resource_for_bulk(resource_type):
    """
    Test that serialize_program_for_bulk yields a valid LearningResourceSerializer for resource types other than "course"
    The "course" resource type is tested by `test_serialize_course_numbers_for_bulk` below.
    """
    resource = factories.LearningResourceFactory.create(resource_type=resource_type)
    assert serializers.serialize_learning_resource_for_bulk(resource) == {
        "_id": resource.id,
        "resource_relations": {"name": "resource"},
        "created_on": resource.created_on,
        **LearningResourceSerializer(resource).data,
    }


@pytest.mark.django_db()
@pytest.mark.parametrize(
    ("readable_id", "sort_course_num"), [("1", "01"), ("15", "15"), ("CMS-W", "CMS-W")]
)
@pytest.mark.parametrize(
    ("extra_num", "sorted_extra_num"), [("2", "02"), ("16", "16"), ("CC", "CC")]
)
def test_serialize_course_numbers_for_bulk(
    readable_id, sort_course_num, extra_num, sorted_extra_num
):
    """
    Test that serialize_course_for_bulk yields a valid LearningResourceSerializer
    """
    course_numbers = [
        {
            "value": readable_id,
            "listing_type": CourseNumberType.primary.value,
            "department": {
                "department_id": readable_id,
                "name": DEPARTMENTS[readable_id],
            },
            "primary": True,
            "sort_coursenum": sort_course_num,
        },
        {
            "value": extra_num,
            "listing_type": CourseNumberType.cross_listed.value,
            "department": {"department_id": extra_num, "name": DEPARTMENTS[extra_num]},
            "primary": False,
            "sort_coursenum": sorted_extra_num,
        },
    ]
    resource = factories.CourseFactory.create(
        course_numbers=course_numbers
    ).learning_resource
    assert resource.course.course_numbers == course_numbers
    expected_data = {
        "_id": resource.id,
        "resource_relations": {"name": "resource"},
        "created_on": resource.created_on,
        **LearningResourceSerializer(resource).data,
    }
    expected_data["course"]["course_numbers"][0] = {
        **expected_data["course"]["course_numbers"][0],
        "primary": True,
        "sort_coursenum": sort_course_num,
    }
    expected_data["course"]["course_numbers"][1] = {
        **expected_data["course"]["course_numbers"][1],
        "primary": False,
        "sort_coursenum": sorted_extra_num,
    }

    assert serializers.serialize_learning_resource_for_bulk(resource) == expected_data


@pytest.mark.django_db()
def test_serialize_bulk_learning_resources_for_deletion():
    """
    Test that serialize_bulk_learning_resources_for_deletion yields correct data
    """
    resource = factories.LearningResourceFactory.create()
    assert list(
        serializers.serialize_bulk_learning_resources_for_deletion([resource.id])
    ) == [{"_id": resource.id, "_op_type": "delete"}]


@pytest.mark.django_db()
def test_serialize_content_file_for_bulk():
    """
    Test that serialize_content_file_for_bulk yields correct data
    """
    content_file = factories.ContentFileFactory.create()
    assert serializers.serialize_content_file_for_bulk(content_file) == {
        "_id": gen_content_file_id(content_file.id),
        "resource_relations": {
            "name": "content_file",
            "parent": content_file.run.learning_resource_id,
        },
        **ContentFileSerializer(content_file).data,
    }


@pytest.mark.django_db()
def test_serialize_content_file_for_bulk_deletion():
    """
    Test that serialize_content_file_for_bulk_deletio yields correct data
    """
    content_file = factories.ContentFileFactory.create()
    assert serializers.serialize_content_file_for_bulk_deletion(content_file) == {
        "_id": gen_content_file_id(content_file.id),
        "_op_type": "delete",
    }


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
        "id": "1",
        "sortby": "-start_date",
        "professional": "true",
        "certification": "false",
        "offered_by": "xpro,ocw",
        "platform": "xpro,edx,ocw",
        "topic": "Math",
        "department": "18,5",
        "level": "high_school,undergraduate",
        "course_feature": "Lecture Videos",
        "aggregations": "resource_type,platform,level",
    }

    cleaned = {
        "q": "text",
        "offset": 1,
        "limit": 1,
        "id": [1],
        "sortby": "-start_date",
        "professional": [True],
        "certification": [False],
        "offered_by": ["xpro", "ocw"],
        "platform": ["xpro", "edx", "ocw"],
        "topic": ["Math"],
        "department": ["18", "5"],
        "level": ["high_school", "undergraduate"],
        "course_feature": ["Lecture Videos"],
        "aggregations": ["resource_type", "platform", "level"],
    }

    request_data = QueryDict("", mutable=True)
    request_data.update(data)

    serialized = LearningResourcesSearchRequestSerializer(data=request_data)
    assert serialized.is_valid() is True
    assert serialized.data == cleaned


def test_content_file_search_request_serializer():
    data = {
        "q": "text",
        "offset": 1,
        "limit": 1,
        "id": "1",
        "sortby": "-id",
        "topic": "Math",
        "aggregations": "topic",
        "content_feature_type": "Assignment",
        "run_id": "1,2",
        "resource_id": "1,2,3",
        "offered_by": "xpro,ocw",
        "platform": "xpro,edx,ocw",
    }

    cleaned = {
        "q": "text",
        "offset": 1,
        "limit": 1,
        "id": [1],
        "sortby": "-id",
        "topic": ["Math"],
        "aggregations": ["topic"],
        "content_feature_type": ["Assignment"],
        "run_id": [1, 2],
        "resource_id": [1, 2, 3],
        "offered_by": ["xpro", "ocw"],
        "platform": ["xpro", "edx", "ocw"],
    }

    request_data = QueryDict("", mutable=True)
    request_data.update(data)

    serialized = ContentFileSearchRequestSerializer(data=request_data)
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
    assert list(serialized.errors[parameter].values()) == [
        ['"spaceship" is not a valid choice.']
    ]


response_test_raw_data_1 = {
    "took": 8,
    "timed_out": False,
    "_shards": {"total": 2, "successful": 2, "skipped": 0, "failed": 0},
    "hits": {
        "total": {"value": 9, "relation": "eq"},
        "max_score": 6.654978,
        "hits": [
            {
                "_index": ("discussions_local_course_6561cf5547d74a3aad746efb5f40a26d"),
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
                    "course_feature": [],
                    "department": None,
                    "professional": True,
                    "certification": "Certificates",
                    "prices": [2250.0],
                    "learning_path": None,
                    "podcast": None,
                    "podcast_episode": None,
                    "runs": [
                        {
                            "id": 633,
                            "instructors": [],
                            "image": None,
                            "run_id": "course-v1:xPRO+MCPO+R1",
                            "title": (
                                "Project Management: Leading Organizations to"
                                " Success"
                            ),
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
                    "course": {
                        "course_numbers": [
                            {
                                "value": "1.001",
                                "department": {
                                    "department_id": "1",
                                    "name": DEPARTMENTS["1"],
                                },
                                "listing_type": "Primary",
                            }
                        ]
                    },
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
                    "title": (
                        "Managing Complex Projects and Organizations for Success"
                    ),
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
response_test_response_1 = {
    "count": 9,
    "next": None,
    "previous": None,
    "results": [
        {
            "id": 5147,
            "topics": [
                {"id": 5, "name": "Management"},
                {"id": 6, "name": "Innovation"},
            ],
            "offered_by": "xPRO",
            "course_feature": [],
            "department": None,
            "professional": True,
            "certification": "Certificates",
            "prices": [2250.0],
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
            "course": {
                "course_numbers": [
                    {
                        "value": "1.001",
                        "department": {
                            "department_id": "1",
                            "name": DEPARTMENTS["1"],
                        },
                        "listing_type": "Primary",
                    }
                ]
            },
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

response_test_raw_data_2 = {
    "took": 13,
    "timed_out": False,
    "_shards": {"total": 2, "successful": 2, "skipped": 0, "failed": 0},
    "hits": {
        "total": {"value": 1, "relation": "eq"},
        "max_score": 9.133309,
        "hits": [
            {
                "_index": "discussions_local_podcast_a558057c44b64f3098895d994051d5ec",
                "_id": "7363",
                "_score": 9.133309,
                "_source": {
                    "image": {
                        "alt": None,
                        "description": None,
                        "id": 575,
                        "url": "https://i1.sndcdn.com/avatars-000316043422-ishfjv-original.jpg",
                    },
                    "languages": None,
                    "learning_path_parents": [],
                    "topics": [
                        {"name": "Science", "id": 3},
                        {"name": "Biology", "id": 5},
                    ],
                    "readable_id": "broadignite-podcastd78a4cb92091316f984b0619fd1dadee",
                    "resource_type": "podcast",
                    "description": "Our podcast features researchers supported by BroadIgnite, a program that connects rising philanthropists with emerging scientific talent at the Broad Institute of MIT and Harvard.",
                    "offered_by": None,
                    "published": True,
                    "title": "BroadIgnite Podcast",
                    "platform": {"code": "podcast", "name": "Podcast"},
                    "url": "https://soundcloud.com/broadignitepodcast",
                    "professional": False,
                    "certification": False,
                    "full_description": "Our podcast features researchers supported by BroadIgnite, a program that connects rising philanthropists with emerging scientific talent at the Broad Institute of MIT and Harvard.",
                    "podcast": {
                        "apple_podcasts_url": "https://podcasts.apple.com/us/podcast/broadignite-podcast/id1210148292",
                        "episode_count": 9,
                        "google_podcasts_url": "https://podcasts.google.com/feed/aHR0cDovL2ZlZWRzLnNvdW5kY2xvdWQuY29tL3VzZXJzL3NvdW5kY2xvdWQ6dXNlcnM6MjQxNzY2MTMyL3NvdW5kcy5yc3M",
                        "rss_url": "http://feeds.soundcloud.com/users/soundcloud:users:241766132/sounds.rss",
                        "id": 86,
                    },
                    "id": 7363,
                    "departments": [],
                    "prices": 0,
                    "last_modified": None,
                    "runs": [],
                    "course_feature": [],
                    "user_list_parents": [],
                },
            }
        ],
    },
    "aggregations": {
        "level": {
            "doc_count": 1,
            "level": {
                "doc_count": 0,
                "level": {
                    "doc_count_error_upper_bound": 0,
                    "sum_other_doc_count": 0,
                    "buckets": [],
                },
            },
        },
        "topic": {
            "doc_count": 1,
            "topic": {
                "doc_count": 2,
                "topic": {
                    "doc_count_error_upper_bound": 0,
                    "sum_other_doc_count": 0,
                    "buckets": [
                        {"key": "Biology", "doc_count": 1},
                        {"key": "Science", "doc_count": 1},
                    ],
                },
            },
        },
        "offered_by": {
            "doc_count": 1,
            "offered_by": {
                "doc_count": 0,
                "offered_by": {
                    "doc_count_error_upper_bound": 0,
                    "sum_other_doc_count": 0,
                    "buckets": [],
                },
            },
        },
        "platform": {
            "doc_count": 1,
            "platform": {
                "doc_count": 1,
                "platform": {
                    "doc_count_error_upper_bound": 0,
                    "sum_other_doc_count": 0,
                    "buckets": [{"key": "podcast", "doc_count": 1}],
                },
            },
        },
        "course_feature": {
            "doc_count": 1,
            "course_feature": {
                "doc_count_error_upper_bound": 0,
                "sum_other_doc_count": 0,
                "buckets": [],
            },
        },
        "professional": {
            "doc_count": 1,
            "professional": {
                "doc_count_error_upper_bound": 0,
                "sum_other_doc_count": 0,
                "buckets": [{"key": 0, "key_as_string": "false", "doc_count": 1}],
            },
        },
        "certification": {
            "doc_count": 1,
            "certification": {
                "doc_count_error_upper_bound": 0,
                "sum_other_doc_count": 0,
                "buckets": [{"key": 0, "key_as_string": "false", "doc_count": 1}],
            },
        },
    },
    "suggest": {
        "description.trigram": [
            {
                "text": "BroadIgnite",
                "offset": 0,
                "length": 11,
                "options": [
                    {"text": "broadignite", "score": 0.039678775, "collate_match": True}
                ],
            }
        ],
        "title.trigram": [
            {
                "text": "BroadIgnite",
                "offset": 0,
                "length": 11,
                "options": [
                    {"text": "broadignite", "score": 0.12272326, "collate_match": True}
                ],
            }
        ],
    },
}

response_test_response_2 = {
    "count": 1,
    "next": None,
    "previous": None,
    "results": [
        {
            "image": {
                "alt": None,
                "description": None,
                "id": 575,
                "url": "https://i1.sndcdn.com/avatars-000316043422-ishfjv-original.jpg",
            },
            "languages": None,
            "learning_path_parents": [],
            "topics": [{"name": "Science", "id": 3}, {"name": "Biology", "id": 5}],
            "readable_id": "broadignite-podcastd78a4cb92091316f984b0619fd1dadee",
            "resource_type": "podcast",
            "description": "Our podcast features researchers supported by BroadIgnite, a program that connects rising philanthropists with emerging scientific talent at the Broad Institute of MIT and Harvard.",
            "offered_by": None,
            "published": True,
            "title": "BroadIgnite Podcast",
            "platform": {"code": "podcast", "name": "Podcast"},
            "url": "https://soundcloud.com/broadignitepodcast",
            "professional": False,
            "certification": False,
            "full_description": "Our podcast features researchers supported by BroadIgnite, a program that connects rising philanthropists with emerging scientific talent at the Broad Institute of MIT and Harvard.",
            "podcast": {
                "apple_podcasts_url": "https://podcasts.apple.com/us/podcast/broadignite-podcast/id1210148292",
                "episode_count": 9,
                "google_podcasts_url": "https://podcasts.google.com/feed/aHR0cDovL2ZlZWRzLnNvdW5kY2xvdWQuY29tL3VzZXJzL3NvdW5kY2xvdWQ6dXNlcnM6MjQxNzY2MTMyL3NvdW5kcy5yc3M",
                "rss_url": "http://feeds.soundcloud.com/users/soundcloud:users:241766132/sounds.rss",
                "id": 86,
            },
            "id": 7363,
            "departments": [],
            "prices": 0,
            "last_modified": None,
            "runs": [],
            "course_feature": [],
            "user_list_parents": [],
        }
    ],
    "metadata": {
        "aggregations": {
            "level": [],
            "topic": [
                {"key": "Biology", "doc_count": 1},
                {"key": "Science", "doc_count": 1},
            ],
            "offered_by": [],
            "platform": [{"key": "podcast", "doc_count": 1}],
            "course_feature": [],
            "professional": [{"key": "false", "doc_count": 1}],
            "certification": [{"key": "false", "doc_count": 1}],
        },
        "suggest": ["broadignite"],
    },
}


@pytest.mark.parametrize(
    ("raw_data", "response"),
    [
        (response_test_raw_data_1, response_test_response_1),
        (response_test_raw_data_2, response_test_response_2),
    ],
)
def test_learning_resources_search_response_serializer(
    settings, raw_data, response, learning_resources_search_view
):
    """
    Test that the search response serializer processes
    opensearch results as expected
    """
    settings.OPENSEARCH_MAX_SUGGEST_HITS = 10
    request = get_request_object(learning_resources_search_view.url)
    assert JSONRenderer().render(
        SearchResponseSerializer(raw_data, context={"request": request}).data
    ) == JSONRenderer().render(response)


def test_percolate_serializer():
    query = {
        "query": {
            "has_child": {
                "type": "content_file",
                "query": {
                    "multi_match": {
                        "query": "new",
                        "fields": [
                            "content",
                            "title.english^3",
                            "short_description.english^2",
                            "content_feature_type",
                        ],
                    }
                },
                "score_mode": "avg",
            }
        },
        "size": 10,
        "_source": {
            "excludes": [
                "course.course_numbers.sort_coursenum",
                "course.course_numbers.primary",
                "created_on",
                "resource_relations",
            ]
        },
    }
    percolate_query = PercolateQueryFactory(query=query, original_query=query)
    serialized = serialize_percolate_query(percolate_query)
    assert "_id" in serialized
    assert "query" in serialized
    assert "has_child" not in serialized["query"]
