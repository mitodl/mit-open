"""API for general search-related functionality"""

import re

from opensearch_dsl import Search

from learning_resources.constants import LEARNING_RESOURCE_SORTBY_OPTIONS
from learning_resources_search.connection import get_default_alias_name
from learning_resources_search.constants import (
    CONTENT_FILE_TYPE,
    COURSE_QUERY_FIELDS,
    COURSE_TYPE,
    DEPARTMENT_QUERY_FIELDS,
    LEARNING_RESOURCE_QUERY_FIELDS,
    LEARNING_RESOURCE_SEARCH_FILTERS,
    LEARNING_RESOURCE_TYPES,
    RESOURCEFILE_QUERY_FIELDS,
    RUN_INSTRUCTORS_QUERY_FIELDS,
    RUNS_QUERY_FIELDS,
    SEARCH_NESTED_FILTERS,
    SOURCE_EXCLUDED_FIELDS,
    TOPICS_QUERY_FIELDS,
)

LEARN_SUGGEST_FIELDS = ["title.trigram", "description.trigram"]
COURSENUM_SORT_FIELD = "course.course_numbers.sort_coursenum"


def gen_content_file_id(content_file_id):
    """
    Generate the OpenSearch document id for a ContentFile

    Args:
        id (int): The id of a ContentFile object

    Returns:
        str: The OpenSearch document id for this object
    """
    return f"cf_{content_file_id}"


def relevant_indexes(resource_types, aggregations):
    """
    Return list of relevent index type for the query

    Args:
        resource_types (list): the resource type parameter for the search
        aggregations (list): the aggregations parameter for the search

    Returns:
        Array(string): array of index names

    """

    if aggregations and "resource_type" in aggregations:
        return map(get_default_alias_name, LEARNING_RESOURCE_TYPES)

    resource_types_copy = resource_types.copy()

    if CONTENT_FILE_TYPE in resource_types_copy:
        resource_types_copy.remove(CONTENT_FILE_TYPE)
        resource_types_copy.append(COURSE_TYPE)

    return map(get_default_alias_name, set(resource_types_copy))


def generate_sort_clause(search_params):
    """
    Return sort clause for the query

    Args:
        sort (dict): the search params
    Returns:
        dict or String: either a dictionary with the sort clause for
            nested sort params or just sort parameter
    """
    sort = (
        LEARNING_RESOURCE_SORTBY_OPTIONS.get(search_params.get("sortby"), {})
        .get("sort")
        .replace("0__", "")
        .replace("__", ".")
    )

    departments = search_params.get("department")

    if "." in sort:
        if sort.startswith("-"):
            field = sort[1:]
            direction = "desc"
        else:
            field = sort
            direction = "asc"

        path = ".".join(field.split(".")[:-1])

        sort_filter = {}
        if field == COURSENUM_SORT_FIELD:
            if departments:
                sort_filter = {
                    "filter": {
                        "bool": {
                            "should": [
                                {
                                    "term": {
                                        f"{path}.department.department_id": department
                                    }
                                }
                                for department in departments
                            ]
                        }
                    }
                }
            else:
                sort_filter = {"filter": {"term": {f"{path}.primary": True}}}
        return {field: {"order": direction, "nested": {"path": path, **sort_filter}}}

    else:
        return sort


def wrap_text_clause(text_query):
    """
    Wrap the text subqueries in a bool query
    Shared by generate_content_file_text_clause and
    generate_learning_resources_text_clause

    Args:
        text_query (dict): dictionary with the opensearch text clauses
    Returns:
        dict: dictionary with the opensearch text clause
    """
    text_bool_clause = [{"bool": text_query}] if text_query else []

    return {
        "bool": {
            "filter": {
                "bool": {"must": text_bool_clause},
            },
            # Add multimatch text query here again to score results based on match
            **text_query,
        }
    }


def generate_content_file_text_clause(text):
    """
    Return text clause for the query

    Args:
        text (string): the text string
    Returns:
        dict: dictionary with the opensearch text clause
    """

    query_type = (
        "query_string" if text.startswith('"') and text.endswith('"') else "multi_match"
    )

    if text:
        text_query = {
            "should": [
                {query_type: {"query": text, "fields": RESOURCEFILE_QUERY_FIELDS}},
                {
                    "nested": {
                        "path": "departments",
                        "query": {
                            query_type: {
                                "query": text,
                                "fields": DEPARTMENT_QUERY_FIELDS,
                            }
                        },
                    }
                },
            ]
        }
    else:
        text_query = {}

    return wrap_text_clause(text_query)


def generate_learning_resources_text_clause(text):
    """
    Return text clause for the query

    Args:
        text (string): the text string
    Returns:
        dict: dictionary with the opensearch text clause
    """

    query_type = (
        "query_string" if text.startswith('"') and text.endswith('"') else "multi_match"
    )

    if text:
        text_query = {
            "should": [
                {query_type: {"query": text, "fields": LEARNING_RESOURCE_QUERY_FIELDS}},
                {
                    "nested": {
                        "path": "topics",
                        "query": {
                            query_type: {"query": text, "fields": TOPICS_QUERY_FIELDS}
                        },
                    }
                },
                {
                    "nested": {
                        "path": "departments",
                        "query": {
                            query_type: {
                                "query": text,
                                "fields": DEPARTMENT_QUERY_FIELDS,
                            }
                        },
                    }
                },
                {
                    "wildcard": {
                        "readable_id": {
                            "value": f"{text.upper()}*",
                            "rewrite": "constant_score",
                        }
                    }
                },
                {
                    "nested": {
                        "path": "course.course_numbers",
                        "query": {
                            query_type: {"query": text, "fields": COURSE_QUERY_FIELDS}
                        },
                    }
                },
                {
                    "nested": {
                        "path": "runs",
                        "query": {
                            query_type: {"query": text, "fields": RUNS_QUERY_FIELDS}
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
                                    query_type: {
                                        "query": text,
                                        "fields": RUN_INSTRUCTORS_QUERY_FIELDS,
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
                            query_type: {
                                "query": text,
                                "fields": RESOURCEFILE_QUERY_FIELDS,
                            }
                        },
                        "score_mode": "avg",
                    }
                },
            ]
        }
    else:
        text_query = {}

    return wrap_text_clause(text_query)


def generate_filter_clauses(search_params):
    """
    Return the filter clauses for the query

    Args:
        search_params (dict): the query parameters for the search
    Returns:
        dict: dictionary with the opensearch filter clauses. Because the filters are
        used to generate aggregations, this function returns a dictionary with each of
        the active filters as the keys and the opensearch filter clause for that
        filter as the query
    """
    filter_clauses = {}

    for search_filter in LEARNING_RESOURCE_SEARCH_FILTERS:
        if search_params.get(search_filter):
            filter_clauses_for_filter = []

            for option in search_params.get(search_filter):
                if search_filter in SEARCH_NESTED_FILTERS:
                    filter_clauses_for_filter.append(
                        {
                            "nested": {
                                "path": SEARCH_NESTED_FILTERS[search_filter].split(".")[
                                    0
                                ],
                                "query": {
                                    "term": {
                                        SEARCH_NESTED_FILTERS[search_filter]: {
                                            "value": option,
                                            "case_insensitive": True,
                                        }
                                    }
                                },
                            }
                        }
                    )

                else:
                    filter_term = {"term": {search_filter: {"value": option}}}

                    if not search_filter.endswith("id"):
                        filter_term["term"][search_filter]["case_insensitive"] = True

                    filter_clauses_for_filter.append(filter_term)

            filter_clauses[search_filter] = {
                "bool": {"should": filter_clauses_for_filter}
            }

    return filter_clauses


def generate_suggest_clause(text):
    """
    Return the suggest clause for the query

    Args:
        text (string): the text string
    Returns:
        dict: dictionary with the opensearch suggest clause
    """

    suggest = {"text": text}

    for field in LEARN_SUGGEST_FIELDS:
        suggest[field] = {
            "phrase": {
                "field": field,
                "size": 5,
                "gram_size": 1,
                "confidence": 0.0001,
                "max_errors": 3,
                "collate": {
                    "query": {
                        "source": {"match_phrase": {"{{field_name}}": "{{suggestion}}"}}
                    },
                    "params": {"field_name": field},
                    "prune": True,
                },
            }
        }

    return suggest


def generate_aggregation_clauses(search_params, filter_clauses):
    """
    Return the aggregations for the query

    Args:
        search_params (dict): the query parameters for the search
        filter_clauses(dict): the filter clauses generated by generate_filter_clauses
    Returns:
        dict: dictionary with the opensearch aggregation clause
    """
    aggregation_clauses = {}
    if search_params.get("aggregations"):
        for aggregation in search_params.get("aggregations"):
            # Each aggregation clause contains a filter which includes all the filters
            # except it's own

            other_filters = [
                filter_clauses[key] for key in filter_clauses if key != aggregation
            ]

            if other_filters:
                if aggregation in SEARCH_NESTED_FILTERS:
                    aggregation_clauses[aggregation] = {
                        "aggs": {
                            aggregation: {
                                "nested": {
                                    "path": SEARCH_NESTED_FILTERS[aggregation].split(
                                        "."
                                    )[0]
                                },
                                "aggs": {
                                    aggregation: {
                                        "terms": {
                                            "field": SEARCH_NESTED_FILTERS[aggregation],
                                            "size": 10000,
                                        }
                                    }
                                },
                            }
                        },
                        "filter": {"bool": {"must": other_filters}},
                    }
                else:
                    aggregation_clauses[aggregation] = {
                        "aggs": {
                            aggregation: {
                                "terms": {
                                    "field": aggregation,
                                    "size": 10000,
                                }
                            }
                        },
                        "filter": {"bool": {"must": other_filters}},
                    }
            elif aggregation in SEARCH_NESTED_FILTERS:
                aggregation_clauses[aggregation] = {
                    "nested": {
                        "path": SEARCH_NESTED_FILTERS[aggregation].split(".")[0]
                    },
                    "aggs": {
                        aggregation: {
                            "terms": {
                                "field": SEARCH_NESTED_FILTERS[aggregation],
                                "size": 10000,
                            }
                        }
                    },
                }
            else:
                aggregation_clauses[aggregation] = {
                    "terms": {
                        "field": aggregation,
                        "size": 10000,
                    }
                }
    return aggregation_clauses


def execute_learn_search(search_params):
    """
    Execute a learning resources search based on the query


    Args:
        search_params (dict): The opensearch query params returned from
        LearningResourcesSearchRequestSerializer

    Returns:
        dict: The opensearch response dict
    """

    if not search_params.get("resource_type"):
        search_params["resource_type"] = list(LEARNING_RESOURCE_TYPES)

    indexes = relevant_indexes(
        search_params.get("resource_type"), search_params.get("aggregations")
    )

    search = Search(index=",".join(indexes))

    search = search.source(fields={"excludes": SOURCE_EXCLUDED_FIELDS})

    if search_params.get("offset"):
        search = search.extra(from_=search_params.get("offset"))

    if search_params.get("limit"):
        search = search.extra(size=search_params.get("limit"))

    if search_params.get("sortby"):
        sort = generate_sort_clause(search_params)

        search = search.sort(sort)

    if search_params.get("q"):
        text = re.sub("[\u201c\u201d]", '"', search_params.get("q"))
        if CONTENT_FILE_TYPE in search_params.get("resource_type"):
            text_query = generate_content_file_text_clause(text)
        else:
            text_query = generate_learning_resources_text_clause(text)

        suggest = generate_suggest_clause(text)
        search = search.query("bool", should=[text_query])
        search = search.extra(suggest=suggest)

    filter_clauses = generate_filter_clauses(search_params)

    search = search.post_filter("bool", must=list(filter_clauses.values()))

    if search_params.get("aggregations"):
        aggregation_clauses = generate_aggregation_clauses(
            search_params, filter_clauses
        )
        search = search.extra(aggs=aggregation_clauses)

    return search.execute().to_dict()
