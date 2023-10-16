# pylint: disable=redefined-outer-name,too-many-lines
"""Search API function tests"""

import pytest

from learning_resources_search.api import (
    execute_learn_search,
    generate_aggregation_clauses,
    generate_filter_clauses,
    generate_sort_clause,
    generate_suggest_clause,
    generate_text_clause,
    relevant_indexes,
)


@pytest.mark.parametrize(
    ("resourse_types", "aggregations", "result"),
    [
        (["course"], [], ["testindex_course_default"]),
        (
            ["course"],
            ["resource_type"],
            ["testindex_course_default", "testindex_program_default"],
        ),
        ([], [], ["testindex_course_default", "testindex_program_default"]),
    ],
)
def test_relevant_indexes(resourse_types, aggregations, result):
    assert list(relevant_indexes(resourse_types, aggregations)) == result


@pytest.mark.parametrize(
    ("sort_param", "result"),
    [
        ("prices", "prices"),
        ("-prices", "-prices"),
        (
            "runs.start_date",
            {"runs.start_date": {"order": "asc", "nested": {"path": "runs"}}},
        ),
        (
            "-runs.start_date",
            {"runs.start_date": {"order": "desc", "nested": {"path": "runs"}}},
        ),
    ],
)
def test_generate_sort_clause(sort_param, result):
    assert generate_sort_clause(sort_param) == result


def test_generate_text_clause():
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
                                                "department",
                                                "resource_content_tags",
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
                                        "wildcard": {
                                            "readable_id": {
                                                "value": "MATH*",
                                                "rewrite": "constant_score",
                                            }
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
                            "department",
                            "resource_content_tags",
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
                    "wildcard": {
                        "readable_id": {"value": "MATH*", "rewrite": "constant_score"}
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
                                                "department",
                                                "resource_content_tags",
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
                                        "wildcard": {
                                            "readable_id": {
                                                "value": '"MATH"*',
                                                "rewrite": "constant_score",
                                            }
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
                            "department",
                            "resource_content_tags",
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
                    "wildcard": {
                        "readable_id": {"value": '"MATH"*', "rewrite": "constant_score"}
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
            ],
        }
    }
    assert generate_text_clause("math") == result1
    assert generate_text_clause('"math"') == result2


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


def test_generate_filter_clauses():
    query = {"offered_by": ["ocw", "xpro"], "level": ["Undergraduate"]}
    result = {
        "offered_by": {
            "bool": {
                "should": [
                    {
                        "term": {
                            "offered_by": {
                                "value": "ocw",
                                "case_insensitive": True,
                            }
                        }
                    },
                    {
                        "term": {
                            "offered_by": {"value": "xpro", "case_insensitive": True}
                        }
                    },
                ]
            }
        },
        "level": {
            "bool": {
                "should": [
                    {
                        "nested": {
                            "path": "runs",
                            "query": {
                                "term": {
                                    "runs.level": {
                                        "value": "Undergraduate",
                                        "case_insensitive": True,
                                    }
                                }
                            },
                        }
                    }
                ]
            }
        },
    }
    assert generate_filter_clauses(query) == result


def test_generate_aggregation_clauses_when_there_is_no_filter():
    params = {"aggregations": ["offered_by", "level"]}
    result = {
        "offered_by": {"terms": {"field": "offered_by", "size": 10000}},
        "level": {
            "nested": {"path": "runs"},
            "aggs": {"level": {"terms": {"field": "runs.level", "size": 10000}}},
        },
    }
    assert generate_aggregation_clauses(params, {}) == result


def test_generate_aggregation_clauses_with_filter():
    params = {"aggregations": ["offered_by", "level"]}
    filters = {"platform": "the filter"}
    result = {
        "offered_by": {
            "aggs": {"offered_by": {"terms": {"field": "offered_by", "size": 10000}}},
            "filter": {"bool": {"must": ["the filter"]}},
        },
        "level": {
            "aggs": {
                "level": {
                    "nested": {"path": "runs"},
                    "aggs": {
                        "level": {"terms": {"field": "runs.level", "size": 10000}}
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
        "offered_by": {
            "aggs": {"offered_by": {"terms": {"field": "offered_by", "size": 10000}}},
            "filter": {"bool": {"must": ["platform filter", "level filter"]}},
        },
        "level": {
            "aggs": {
                "level": {
                    "nested": {"path": "runs"},
                    "aggs": {
                        "level": {"terms": {"field": "runs.level", "size": 10000}}
                    },
                }
            },
            "filter": {"bool": {"must": ["platform filter", "offered_by filter"]}},
        },
    }
    assert generate_aggregation_clauses(params, filters) == result


def test_execute_learn_search(opensearch):
    opensearch.conn.search.return_value = {
        "hits": {"total": {"value": 10, "relation": "eq"}}
    }
    search_params = {
        "aggregations": ["offered_by"],
        "q": "math",
        "resource_type": ["course"],
        "limit": 1,
        "offset": 1,
        "sortby": "prices",
    }

    query = {
        "query": {
            "bool": {
                "should": [
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
                                                                    "department",
                                                                    "resource_content_tags",
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
                                                            "wildcard": {
                                                                "readable_id": {
                                                                    "value": "MATH*",
                                                                    "rewrite": "constant_score",
                                                                }
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
                                            "department",
                                            "resource_content_tags",
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
                                    "wildcard": {
                                        "readable_id": {
                                            "value": "MATH*",
                                            "rewrite": "constant_score",
                                        }
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
                            ],
                        }
                    }
                ]
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
                    }
                ]
            }
        },
        "sort": ["prices"],
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
                    "offered_by": {"terms": {"field": "offered_by", "size": 10000}}
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
                            }
                        ]
                    }
                },
            }
        },
    }

    assert execute_learn_search(search_params) == opensearch.conn.search.return_value

    opensearch.conn.search.assert_called_once_with(
        body=query,
        index=["testindex_course_default"],
    )
