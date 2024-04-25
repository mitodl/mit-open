"""Search API function tests"""

from unittest.mock import Mock

import pytest

from learning_resources_search.api import (
    execute_learn_search,
    generate_aggregation_clause,
    generate_aggregation_clauses,
    generate_content_file_text_clause,
    generate_filter_clause,
    generate_filter_clauses,
    generate_learning_resources_text_clause,
    generate_sort_clause,
    generate_suggest_clause,
    get_similar_topics,
    relevant_indexes,
)
from learning_resources_search.constants import (
    CONTENT_FILE_TYPE,
    COURSE_TYPE,
    LEARNING_RESOURCE,
)


def os_topic(topic_name) -> Mock:
    """
    Given a topic name, return a mock object emulating an
    OpenSearch topic AttrDict object
    """
    return Mock(to_dict=Mock(return_value={"name": topic_name}))


@pytest.mark.parametrize(
    ("endpoint", "resourse_types", "aggregations", "result"),
    [
        (LEARNING_RESOURCE, ["course"], [], ["testindex_course_default"]),
        (
            LEARNING_RESOURCE,
            ["course"],
            ["resource_type"],
            [
                "testindex_course_default",
                "testindex_program_default",
                "testindex_podcast_default",
                "testindex_podcast_episode_default",
                "testindex_learning_path_default",
                "testindex_video_default",
                "testindex_video_playlist_default",
            ],
        ),
        (CONTENT_FILE_TYPE, ["content_file"], [], ["testindex_course_default"]),
    ],
)
def test_relevant_indexes(endpoint, resourse_types, aggregations, result):
    assert list(relevant_indexes(resourse_types, aggregations, endpoint)) == result


@pytest.mark.parametrize(
    ("sort_param", "departments", "result"),
    [
        ("id", None, "id"),
        ("-id", ["7"], "-id"),
        (
            "start_date",
            ["5"],
            {"runs.start_date": {"order": "asc", "nested": {"path": "runs"}}},
        ),
        (
            "-start_date",
            None,
            {"runs.start_date": {"order": "desc", "nested": {"path": "runs"}}},
        ),
        (
            "mitcoursenumber",
            None,
            {
                "course.course_numbers.sort_coursenum": {
                    "order": "asc",
                    "nested": {
                        "path": "course.course_numbers",
                        "filter": {"term": {"course.course_numbers.primary": True}},
                    },
                }
            },
        ),
        (
            "mitcoursenumber",
            ["7", "5"],
            {
                "course.course_numbers.sort_coursenum": {
                    "order": "asc",
                    "nested": {
                        "path": "course.course_numbers",
                        "filter": {
                            "bool": {
                                "should": [
                                    {
                                        "term": {
                                            "course.course_numbers.department.department_id": (
                                                "7"
                                            )
                                        }
                                    },
                                    {
                                        "term": {
                                            "course.course_numbers.department.department_id": (
                                                "5"
                                            )
                                        }
                                    },
                                ]
                            }
                        },
                    },
                }
            },
        ),
    ],
)
def test_generate_sort_clause(sort_param, departments, result):
    params = {"sortby": sort_param, "department": departments}
    assert generate_sort_clause(params) == result


def test_generate_learning_resources_text_clause():
    result1 = {
        "bool": {
            "filter": {
                "bool": {
                    "must": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "multi_match": {
                                            "query": "math",
                                            "fields": [
                                                "title.english^3",
                                                "description.english^2",
                                                "full_description.english",
                                                "topics",
                                                "platform",
                                                "readable_id",
                                                "offered_by",
                                                "course_feature",
                                                "course",
                                                "video.transcript.english",
                                            ],
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "topics",
                                            "query": {
                                                "multi_match": {
                                                    "query": "math",
                                                    "fields": ["topics.name"],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "departments",
                                            "query": {
                                                "multi_match": {
                                                    "query": "math",
                                                    "fields": [
                                                        "departments.department_id"
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "wildcard": {
                                            "readable_id": {
                                                "value": "MATH*",
                                                "rewrite": "constant_score",
                                            }
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "course.course_numbers",
                                            "query": {
                                                "multi_match": {
                                                    "query": "math",
                                                    "fields": [
                                                        "course.course_numbers.value",
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "runs",
                                            "query": {
                                                "multi_match": {
                                                    "query": "math",
                                                    "fields": [
                                                        "runs.year",
                                                        "runs.semester",
                                                        "runs.level",
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "runs",
                                            "query": {
                                                "nested": {
                                                    "path": "runs.instructors",
                                                    "query": {
                                                        "multi_match": {
                                                            "query": "math",
                                                            "fields": [
                                                                "runs.instructors.first_name",
                                                                "runs.instructors.last_name",
                                                                "runs.instructors.full_name",
                                                            ],
                                                        }
                                                    },
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "has_child": {
                                            "type": "content_file",
                                            "query": {
                                                "multi_match": {
                                                    "query": "math",
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
                                ]
                            }
                        }
                    ]
                }
            },
            "should": [
                {
                    "multi_match": {
                        "query": "math",
                        "fields": [
                            "title.english^3",
                            "description.english^2",
                            "full_description.english",
                            "topics",
                            "platform",
                            "readable_id",
                            "offered_by",
                            "course_feature",
                            "course",
                            "video.transcript.english",
                        ],
                    }
                },
                {
                    "nested": {
                        "path": "topics",
                        "query": {
                            "multi_match": {"query": "math", "fields": ["topics.name"]}
                        },
                    }
                },
                {
                    "nested": {
                        "path": "departments",
                        "query": {
                            "multi_match": {
                                "query": "math",
                                "fields": ["departments.department_id"],
                            }
                        },
                    }
                },
                {
                    "wildcard": {
                        "readable_id": {"value": "MATH*", "rewrite": "constant_score"}
                    }
                },
                {
                    "nested": {
                        "path": "course.course_numbers",
                        "query": {
                            "multi_match": {
                                "query": "math",
                                "fields": [
                                    "course.course_numbers.value",
                                ],
                            }
                        },
                    }
                },
                {
                    "nested": {
                        "path": "runs",
                        "query": {
                            "multi_match": {
                                "query": "math",
                                "fields": ["runs.year", "runs.semester", "runs.level"],
                            }
                        },
                    }
                },
                {
                    "nested": {
                        "path": "runs",
                        "query": {
                            "nested": {
                                "path": "runs.instructors",
                                "query": {
                                    "multi_match": {
                                        "query": "math",
                                        "fields": [
                                            "runs.instructors.first_name",
                                            "runs.instructors.last_name",
                                            "runs.instructors.full_name",
                                        ],
                                    }
                                },
                            }
                        },
                    }
                },
                {
                    "has_child": {
                        "type": "content_file",
                        "query": {
                            "multi_match": {
                                "query": "math",
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
            ],
        }
    }
    result2 = {
        "bool": {
            "filter": {
                "bool": {
                    "must": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "query_string": {
                                            "query": '"math"',
                                            "fields": [
                                                "title.english^3",
                                                "description.english^2",
                                                "full_description.english",
                                                "topics",
                                                "platform",
                                                "readable_id",
                                                "offered_by",
                                                "course_feature",
                                                "course",
                                                "video.transcript.english",
                                            ],
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "topics",
                                            "query": {
                                                "query_string": {
                                                    "query": '"math"',
                                                    "fields": ["topics.name"],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "departments",
                                            "query": {
                                                "query_string": {
                                                    "query": '"math"',
                                                    "fields": [
                                                        "departments.department_id"
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "wildcard": {
                                            "readable_id": {
                                                "value": '"MATH"*',
                                                "rewrite": "constant_score",
                                            }
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "course.course_numbers",
                                            "query": {
                                                "query_string": {
                                                    "query": '"math"',
                                                    "fields": [
                                                        "course.course_numbers.value",
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "runs",
                                            "query": {
                                                "query_string": {
                                                    "query": '"math"',
                                                    "fields": [
                                                        "runs.year",
                                                        "runs.semester",
                                                        "runs.level",
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "runs",
                                            "query": {
                                                "nested": {
                                                    "path": "runs.instructors",
                                                    "query": {
                                                        "query_string": {
                                                            "query": '"math"',
                                                            "fields": [
                                                                "runs.instructors.first_name",
                                                                "runs.instructors.last_name",
                                                                "runs.instructors.full_name",
                                                            ],
                                                        }
                                                    },
                                                }
                                            },
                                        }
                                    },
                                    {
                                        "has_child": {
                                            "type": "content_file",
                                            "query": {
                                                "query_string": {
                                                    "query": '"math"',
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
                                ]
                            }
                        }
                    ]
                }
            },
            "should": [
                {
                    "query_string": {
                        "query": '"math"',
                        "fields": [
                            "title.english^3",
                            "description.english^2",
                            "full_description.english",
                            "topics",
                            "platform",
                            "readable_id",
                            "offered_by",
                            "course_feature",
                            "course",
                            "video.transcript.english",
                        ],
                    }
                },
                {
                    "nested": {
                        "path": "topics",
                        "query": {
                            "query_string": {
                                "query": '"math"',
                                "fields": ["topics.name"],
                            }
                        },
                    }
                },
                {
                    "nested": {
                        "path": "departments",
                        "query": {
                            "query_string": {
                                "query": '"math"',
                                "fields": ["departments.department_id"],
                            }
                        },
                    }
                },
                {
                    "wildcard": {
                        "readable_id": {"value": '"MATH"*', "rewrite": "constant_score"}
                    }
                },
                {
                    "nested": {
                        "path": "course.course_numbers",
                        "query": {
                            "query_string": {
                                "query": '"math"',
                                "fields": [
                                    "course.course_numbers.value",
                                ],
                            }
                        },
                    }
                },
                {
                    "nested": {
                        "path": "runs",
                        "query": {
                            "query_string": {
                                "query": '"math"',
                                "fields": ["runs.year", "runs.semester", "runs.level"],
                            }
                        },
                    }
                },
                {
                    "nested": {
                        "path": "runs",
                        "query": {
                            "nested": {
                                "path": "runs.instructors",
                                "query": {
                                    "query_string": {
                                        "query": '"math"',
                                        "fields": [
                                            "runs.instructors.first_name",
                                            "runs.instructors.last_name",
                                            "runs.instructors.full_name",
                                        ],
                                    }
                                },
                            }
                        },
                    }
                },
                {
                    "has_child": {
                        "type": "content_file",
                        "query": {
                            "query_string": {
                                "query": '"math"',
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
            ],
        }
    }
    assert generate_learning_resources_text_clause("math") == result1
    assert generate_learning_resources_text_clause('"math"') == result2


def test_generate_content_file_text_clause():
    result1 = {
        "bool": {
            "filter": {
                "bool": {
                    "must": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "multi_match": {
                                            "query": "math",
                                            "fields": [
                                                "content",
                                                "title.english^3",
                                                "short_description.english^2",
                                                "content_feature_type",
                                            ],
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "departments",
                                            "query": {
                                                "multi_match": {
                                                    "query": "math",
                                                    "fields": [
                                                        "departments.department_id"
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                ]
                            }
                        }
                    ]
                }
            },
            "should": [
                {
                    "multi_match": {
                        "query": "math",
                        "fields": [
                            "content",
                            "title.english^3",
                            "short_description.english^2",
                            "content_feature_type",
                        ],
                    }
                },
                {
                    "nested": {
                        "path": "departments",
                        "query": {
                            "multi_match": {
                                "query": "math",
                                "fields": ["departments.department_id"],
                            }
                        },
                    }
                },
            ],
        }
    }
    result2 = {
        "bool": {
            "filter": {
                "bool": {
                    "must": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "query_string": {
                                            "query": '"math"',
                                            "fields": [
                                                "content",
                                                "title.english^3",
                                                "short_description.english^2",
                                                "content_feature_type",
                                            ],
                                        }
                                    },
                                    {
                                        "nested": {
                                            "path": "departments",
                                            "query": {
                                                "query_string": {
                                                    "query": '"math"',
                                                    "fields": [
                                                        "departments.department_id"
                                                    ],
                                                }
                                            },
                                        }
                                    },
                                ]
                            }
                        }
                    ]
                }
            },
            "should": [
                {
                    "query_string": {
                        "query": '"math"',
                        "fields": [
                            "content",
                            "title.english^3",
                            "short_description.english^2",
                            "content_feature_type",
                        ],
                    }
                },
                {
                    "nested": {
                        "path": "departments",
                        "query": {
                            "query_string": {
                                "query": '"math"',
                                "fields": ["departments.department_id"],
                            }
                        },
                    }
                },
            ],
        }
    }
    assert generate_content_file_text_clause("math") == result1
    assert generate_content_file_text_clause('"math"') == result2


def test_generate_suggest_clause():
    result = {
        "text": "math",
        "title.trigram": {
            "phrase": {
                "field": "title.trigram",
                "size": 5,
                "gram_size": 1,
                "confidence": 0.0001,
                "max_errors": 3,
                "collate": {
                    "query": {
                        "source": {"match_phrase": {"{{field_name}}": "{{suggestion}}"}}
                    },
                    "params": {"field_name": "title.trigram"},
                    "prune": True,
                },
            }
        },
        "description.trigram": {
            "phrase": {
                "field": "description.trigram",
                "size": 5,
                "gram_size": 1,
                "confidence": 0.0001,
                "max_errors": 3,
                "collate": {
                    "query": {
                        "source": {"match_phrase": {"{{field_name}}": "{{suggestion}}"}}
                    },
                    "params": {"field_name": "description.trigram"},
                    "prune": True,
                },
            }
        },
    }
    assert generate_suggest_clause("math") == result


@pytest.mark.parametrize("case_sensitive", [False, True])
def test_generate_filter_clause_not_nested(case_sensitive):
    case_sensitivity = {} if case_sensitive else {"case_insensitive": True}
    assert generate_filter_clause("a", "some-value", case_sensitive=case_sensitive) == {
        "term": {"a": {"value": "some-value", **case_sensitivity}}
    }


@pytest.mark.parametrize("case_sensitive", [False, True])
def test_generate_filter_clause_with_nesting(case_sensitive):
    case_sensitivity = {} if case_sensitive else {"case_insensitive": True}
    assert generate_filter_clause(
        "a.b.c.d", "some-value", case_sensitive=case_sensitive
    ) == {
        "nested": {
            "path": "a",
            "query": {
                "nested": {
                    "path": "a.b",
                    "query": {
                        "nested": {
                            "path": "a.b.c",
                            "query": {
                                "term": {
                                    "a.b.c.d": {
                                        "value": "some-value",
                                        **case_sensitivity,
                                    }
                                }
                            },
                        }
                    },
                }
            },
        }
    }


def test_generate_filter_clauses():
    query = {"offered_by": ["ocw", "xpro"], "level": ["Undergraduate"]}
    result = {
        "level": {
            "bool": {
                "should": [
                    {
                        "nested": {
                            "path": "runs",
                            "query": {
                                "nested": {
                                    "path": "runs.level",
                                    "query": {
                                        "term": {
                                            "runs.level.code": {
                                                "case_insensitive": True,
                                                "value": "Undergraduate",
                                            }
                                        }
                                    },
                                }
                            },
                        }
                    }
                ]
            }
        },
        "offered_by": {
            "bool": {
                "should": [
                    {
                        "nested": {
                            "path": "offered_by",
                            "query": {
                                "term": {
                                    "offered_by.code": {
                                        "case_insensitive": True,
                                        "value": "ocw",
                                    }
                                }
                            },
                        }
                    },
                    {
                        "nested": {
                            "path": "offered_by",
                            "query": {
                                "term": {
                                    "offered_by.code": {
                                        "case_insensitive": True,
                                        "value": "xpro",
                                    }
                                }
                            },
                        }
                    },
                ]
            }
        },
    }
    assert generate_filter_clauses(query) == result


def test_generate_aggregation_clauses_when_there_is_no_filter():
    params = {"aggregations": ["offered_by", "level"]}
    result = {
        "offered_by": {
            "aggs": {
                "offered_by": {
                    "terms": {"field": "offered_by.code", "size": 10000},
                    "aggs": {"root": {"reverse_nested": {}}},
                }
            },
            "nested": {"path": "offered_by"},
        },
        "level": {
            "nested": {"path": "runs"},
            "aggs": {
                "level": {
                    "nested": {"path": "runs.level"},
                    "aggs": {
                        "level": {
                            "terms": {"field": "runs.level.code", "size": 10000},
                            "aggs": {"root": {"reverse_nested": {}}},
                        }
                    },
                }
            },
        },
    }
    assert generate_aggregation_clauses(params, {}) == result


def test_generate_aggregation_clause_single_not_nested():
    assert generate_aggregation_clause("agg_a", "a") == {
        "terms": {"field": "a", "size": 10000}
    }


def test_generate_aggregation_clause_single_nested():
    assert generate_aggregation_clause("some_name", "a.b.c") == {
        "nested": {"path": "a"},
        "aggs": {
            "some_name": {
                "nested": {"path": "a.b"},
                "aggs": {
                    "some_name": {
                        "terms": {"field": "a.b.c", "size": 10000},
                        "aggs": {"root": {"reverse_nested": {}}},
                    }
                },
            }
        },
    }


def test_generate_aggregation_clauses_with_filter():
    params = {"aggregations": ["offered_by", "level"]}
    filters = {"platform": "the filter"}
    result = {
        "offered_by": {
            "aggs": {
                "offered_by": {
                    "aggs": {
                        "offered_by": {
                            "terms": {"field": "offered_by.code", "size": 10000},
                            "aggs": {"root": {"reverse_nested": {}}},
                        }
                    },
                    "nested": {"path": "offered_by"},
                }
            },
            "filter": {"bool": {"must": ["the filter"]}},
        },
        "level": {
            "aggs": {
                "level": {
                    "nested": {"path": "runs"},
                    "aggs": {
                        "level": {
                            "nested": {"path": "runs.level"},
                            "aggs": {
                                "level": {
                                    "terms": {
                                        "field": "runs.level.code",
                                        "size": 10000,
                                    },
                                    "aggs": {"root": {"reverse_nested": {}}},
                                }
                            },
                        }
                    },
                }
            },
            "filter": {"bool": {"must": ["the filter"]}},
        },
    }
    assert generate_aggregation_clauses(params, filters) == result


def test_generate_aggregation_clauses_with_same_filters_as_aggregation():
    params = {"aggregations": ["offered_by", "level"]}
    filters = {
        "platform": "platform filter",
        "offered_by": "offered_by filter",
        "level": "level filter",
    }
    result = {
        "level": {
            "aggs": {
                "level": {
                    "aggs": {
                        "level": {
                            "aggs": {
                                "level": {
                                    "terms": {
                                        "field": "runs.level.code",
                                        "size": 10000,
                                    },
                                    "aggs": {"root": {"reverse_nested": {}}},
                                },
                            },
                            "nested": {"path": "runs.level"},
                        }
                    },
                    "nested": {"path": "runs"},
                }
            },
            "filter": {"bool": {"must": ["platform filter", "offered_by filter"]}},
        },
        "offered_by": {
            "aggs": {
                "offered_by": {
                    "aggs": {
                        "offered_by": {
                            "terms": {"field": "offered_by.code", "size": 10000},
                            "aggs": {"root": {"reverse_nested": {}}},
                        }
                    },
                    "nested": {"path": "offered_by"},
                }
            },
            "filter": {"bool": {"must": ["platform filter", "level filter"]}},
        },
    }
    assert generate_aggregation_clauses(params, filters) == result


def test_execute_learn_search_for_learning_resource_query(opensearch):
    opensearch.conn.search.return_value = {
        "hits": {"total": {"value": 10, "relation": "eq"}}
    }
    search_params = {
        "aggregations": ["offered_by"],
        "q": "math",
        "resource_type": ["course"],
        "free": [True],
        "limit": 1,
        "offset": 1,
        "sortby": "-readable_id",
        "endpoint": LEARNING_RESOURCE,
    }

    query = {
        "query": {
            "bool": {
                "must": [
                    {
                        "bool": {
                            "filter": [
                                {
                                    "bool": {
                                        "must": [
                                            {
                                                "bool": {
                                                    "should": [
                                                        {
                                                            "multi_match": {
                                                                "query": "math",
                                                                "fields": [
                                                                    "title.english^3",
                                                                    "description.english^2",
                                                                    "full_description.english",
                                                                    "topics",
                                                                    "platform",
                                                                    "readable_id",
                                                                    "offered_by",
                                                                    "course_feature",
                                                                    "course",
                                                                    "video.transcript.english",
                                                                ],
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "topics",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "math",
                                                                        "fields": [
                                                                            "topics.name"
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "departments",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "math",
                                                                        "fields": [
                                                                            "departments.department_id"
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "wildcard": {
                                                                "readable_id": {
                                                                    "value": "MATH*",
                                                                    "rewrite": "constant_score",
                                                                }
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "course.course_numbers",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "math",
                                                                        "fields": [
                                                                            "course.course_numbers.value"
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "runs",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "math",
                                                                        "fields": [
                                                                            "runs.year",
                                                                            "runs.semester",
                                                                            "runs.level",
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "runs",
                                                                "query": {
                                                                    "nested": {
                                                                        "path": "runs.instructors",
                                                                        "query": {
                                                                            "multi_match": {
                                                                                "query": "math",
                                                                                "fields": [
                                                                                    "runs.instructors.first_name",
                                                                                    "runs.instructors.last_name",
                                                                                    "runs.instructors.full_name",
                                                                                ],
                                                                            }
                                                                        },
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "has_child": {
                                                                "type": "content_file",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "math",
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
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            "should": [
                                {
                                    "multi_match": {
                                        "query": "math",
                                        "fields": [
                                            "title.english^3",
                                            "description.english^2",
                                            "full_description.english",
                                            "topics",
                                            "platform",
                                            "readable_id",
                                            "offered_by",
                                            "course_feature",
                                            "course",
                                            "video.transcript.english",
                                        ],
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "topics",
                                        "query": {
                                            "multi_match": {
                                                "query": "math",
                                                "fields": ["topics.name"],
                                            }
                                        },
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "departments",
                                        "query": {
                                            "multi_match": {
                                                "query": "math",
                                                "fields": ["departments.department_id"],
                                            }
                                        },
                                    }
                                },
                                {
                                    "wildcard": {
                                        "readable_id": {
                                            "value": "MATH*",
                                            "rewrite": "constant_score",
                                        }
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "course.course_numbers",
                                        "query": {
                                            "multi_match": {
                                                "query": "math",
                                                "fields": [
                                                    "course.course_numbers.value"
                                                ],
                                            }
                                        },
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "runs",
                                        "query": {
                                            "multi_match": {
                                                "query": "math",
                                                "fields": [
                                                    "runs.year",
                                                    "runs.semester",
                                                    "runs.level",
                                                ],
                                            }
                                        },
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "runs",
                                        "query": {
                                            "nested": {
                                                "path": "runs.instructors",
                                                "query": {
                                                    "multi_match": {
                                                        "query": "math",
                                                        "fields": [
                                                            "runs.instructors.first_name",
                                                            "runs.instructors.last_name",
                                                            "runs.instructors.full_name",
                                                        ],
                                                    }
                                                },
                                            }
                                        },
                                    }
                                },
                                {
                                    "has_child": {
                                        "type": "content_file",
                                        "query": {
                                            "multi_match": {
                                                "query": "math",
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
                            ],
                        }
                    }
                ],
                "filter": [{"exists": {"field": "resource_type"}}],
            }
        },
        "post_filter": {
            "bool": {
                "must": [
                    {
                        "bool": {
                            "should": [
                                {
                                    "term": {
                                        "resource_type": {
                                            "value": "course",
                                            "case_insensitive": True,
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "bool": {
                            "should": [
                                {
                                    "term": {
                                        "free": {
                                            "case_insensitive": True,
                                            "value": True,
                                        }
                                    }
                                }
                            ]
                        }
                    },
                ]
            }
        },
        "sort": [{"readable_id": {"order": "desc"}}],
        "from": 1,
        "size": 1,
        "suggest": {
            "text": "math",
            "title.trigram": {
                "phrase": {
                    "field": "title.trigram",
                    "size": 5,
                    "gram_size": 1,
                    "confidence": 0.0001,
                    "max_errors": 3,
                    "collate": {
                        "query": {
                            "source": {
                                "match_phrase": {"{{field_name}}": "{{suggestion}}"}
                            }
                        },
                        "params": {"field_name": "title.trigram"},
                        "prune": True,
                    },
                }
            },
            "description.trigram": {
                "phrase": {
                    "field": "description.trigram",
                    "size": 5,
                    "gram_size": 1,
                    "confidence": 0.0001,
                    "max_errors": 3,
                    "collate": {
                        "query": {
                            "source": {
                                "match_phrase": {"{{field_name}}": "{{suggestion}}"}
                            }
                        },
                        "params": {"field_name": "description.trigram"},
                        "prune": True,
                    },
                }
            },
        },
        "aggs": {
            "offered_by": {
                "aggs": {
                    "offered_by": {
                        "nested": {"path": "offered_by"},
                        "aggs": {
                            "offered_by": {
                                "terms": {"field": "offered_by.code", "size": 10000},
                                "aggs": {"root": {"reverse_nested": {}}},
                            }
                        },
                    }
                },
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "course",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "term": {
                                                "free": {
                                                    "case_insensitive": True,
                                                    "value": True,
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                        ]
                    }
                },
            }
        },
        "_source": {
            "excludes": [
                "course.course_numbers.sort_coursenum",
                "course.course_numbers.primary",
                "created_on",
                "resource_relations",
                "free",
            ]
        },
    }

    assert execute_learn_search(search_params) == opensearch.conn.search.return_value

    opensearch.conn.search.assert_called_once_with(
        body=query,
        index=["testindex_course_default"],
    )


def test_execute_learn_search_for_content_file_query(opensearch):
    opensearch.conn.search.return_value = {
        "hits": {"total": {"value": 10, "relation": "eq"}}
    }

    search_params = {
        "aggregations": ["offered_by"],
        "q": "math",
        "limit": 1,
        "offset": 1,
        "content_feature_type": ["Online Textbook"],
        "endpoint": CONTENT_FILE_TYPE,
    }

    query = {
        "query": {
            "bool": {
                "must": [
                    {
                        "bool": {
                            "filter": [
                                {
                                    "bool": {
                                        "must": [
                                            {
                                                "bool": {
                                                    "should": [
                                                        {
                                                            "multi_match": {
                                                                "query": "math",
                                                                "fields": [
                                                                    "content",
                                                                    "title.english^3",
                                                                    "short_description.english^2",
                                                                    "content_feature_type",
                                                                ],
                                                            }
                                                        },
                                                        {
                                                            "nested": {
                                                                "path": "departments",
                                                                "query": {
                                                                    "multi_match": {
                                                                        "query": "math",
                                                                        "fields": [
                                                                            "departments.department_id"
                                                                        ],
                                                                    }
                                                                },
                                                            }
                                                        },
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ],
                            "should": [
                                {
                                    "multi_match": {
                                        "query": "math",
                                        "fields": [
                                            "content",
                                            "title.english^3",
                                            "short_description.english^2",
                                            "content_feature_type",
                                        ],
                                    }
                                },
                                {
                                    "nested": {
                                        "path": "departments",
                                        "query": {
                                            "multi_match": {
                                                "query": "math",
                                                "fields": ["departments.department_id"],
                                            }
                                        },
                                    }
                                },
                            ],
                        }
                    }
                ],
                "filter": [{"exists": {"field": "content_type"}}],
            }
        },
        "post_filter": {
            "bool": {
                "must": [
                    {
                        "bool": {
                            "should": [
                                {
                                    "term": {
                                        "content_feature_type": {
                                            "value": "Online Textbook",
                                            "case_insensitive": True,
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        "from": 1,
        "size": 1,
        "suggest": {
            "text": "math",
            "title.trigram": {
                "phrase": {
                    "field": "title.trigram",
                    "size": 5,
                    "gram_size": 1,
                    "confidence": 0.0001,
                    "max_errors": 3,
                    "collate": {
                        "query": {
                            "source": {
                                "match_phrase": {"{{field_name}}": "{{suggestion}}"}
                            }
                        },
                        "params": {"field_name": "title.trigram"},
                        "prune": True,
                    },
                }
            },
            "description.trigram": {
                "phrase": {
                    "field": "description.trigram",
                    "size": 5,
                    "gram_size": 1,
                    "confidence": 0.0001,
                    "max_errors": 3,
                    "collate": {
                        "query": {
                            "source": {
                                "match_phrase": {"{{field_name}}": "{{suggestion}}"}
                            }
                        },
                        "params": {"field_name": "description.trigram"},
                        "prune": True,
                    },
                }
            },
        },
        "aggs": {
            "offered_by": {
                "aggs": {
                    "offered_by": {
                        "nested": {"path": "offered_by"},
                        "aggs": {
                            "offered_by": {
                                "terms": {"field": "offered_by.code", "size": 10000},
                                "aggs": {"root": {"reverse_nested": {}}},
                            }
                        },
                    }
                },
                "filter": {
                    "bool": {
                        "must": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "term": {
                                                "content_feature_type": {
                                                    "value": "Online Textbook",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
            }
        },
        "_source": {
            "excludes": [
                "course.course_numbers.sort_coursenum",
                "course.course_numbers.primary",
                "created_on",
                "resource_relations",
                "free",
            ]
        },
    }

    assert execute_learn_search(search_params) == opensearch.conn.search.return_value

    opensearch.conn.search.assert_called_once_with(
        body=query,
        index=["testindex_course_default"],
    )


def test_get_similar_topics(settings, opensearch):
    """Test get_similar_topics makes a query for similar document topics"""
    input_doc = {"title": "title text", "description": "description text"}

    # topic d is least popular and should not show up, order does not matter
    opensearch.conn.search.return_value = {
        "hits": {
            "hits": [
                {
                    "_source": {
                        "topics": [
                            os_topic("topic a"),
                            os_topic("topic b"),
                            os_topic("topic d"),
                        ]
                    }
                },
                {"_source": {"topics": [os_topic("topic a"), os_topic("topic c")]}},
                {"_source": {"topics": [os_topic("topic a"), os_topic("topic c")]}},
                {"_source": {"topics": [os_topic("topic a"), os_topic("topic c")]}},
                {"_source": {"topics": [os_topic("topic a"), os_topic("topic b")]}},
            ]
        }
    }

    # results should be top 3 in decreasing order of frequency
    assert get_similar_topics(input_doc, 3, 1, 15) == ["topic a", "topic c", "topic b"]

    opensearch.conn.search.assert_called_once_with(
        body={
            "_source": {"includes": "topics"},
            "query": {
                "bool": {
                    "filter": [{"term": {"resource_type": "course"}}],
                    "must": [
                        {
                            "more_like_this": {
                                "like": [
                                    {
                                        "doc": input_doc,
                                        "fields": ["title", "description"],
                                    }
                                ],
                                "fields": [
                                    "course.course_numbers.value",
                                    "title",
                                    "description",
                                    "full_description",
                                ],
                                "min_term_freq": 1,
                                "min_doc_freq": 15,
                            }
                        }
                    ],
                }
            },
        },
        index=[f"{settings.OPENSEARCH_INDEX}_{COURSE_TYPE}_default"],
    )
