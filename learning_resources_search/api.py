"""API for general search-related functionality"""
import re

from opensearch_dsl import Search

from learning_resources_search.connection import get_default_alias_name
from learning_resources_search.constants import (
    LEARNING_RESOURCE_QUERY_FIELDS,
    LEARNING_RESOURCE_SEARCH_FILTERS,
    LEARNING_RESOURCE_TYPES,
    RUN_INSTRUCTORS_QUERY_FIELDS,
    RUNS_QUERY_FIELDS,
    SEARCH_NESTED_FILTERS,
    TOPICS_QUERY_FIELDS,
)
from learning_resources_search.serializers import OSLearningResourceSerializer

SIMILAR_RESOURCE_RELEVANT_FIELDS = ["title", "short_description"]
LEARN_SUGGEST_FIELDS = ["title.trigram", "description.trigram"]


def relevant_indexes(resource_types, aggregations):
    """
    Return list of relevent index type for the query

    Args:
        resource_types (list): the resource type parameter for the search
        aggregations (list): the aggregations parameter for the search

    Returns:
        Array(string): array of index names

    """

    if not resource_types or (aggregations and "resource_type" in aggregations):
        return map(get_default_alias_name, LEARNING_RESOURCE_TYPES)

    return map(get_default_alias_name, resource_types)


def generate_sort_clause(sort):
    """
    Return sort clause for the query

    Args:
        sort (string): the sort parameter
    Returns:
        dict or String: either a dictionary with the sort clause for
            nested sort params or just sort parameter
    """

    if "." in sort:
        if sort.startswith("-"):
            field = sort[1:]
            direction = "desc"
        else:
            field = sort
            direction = "asc"

        path = ".".join(field.split(".")[:-1])

        return {field: {"order": direction, "nested": {"path": path}}}

    else:
        return sort


def generate_text_clause(text):
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
                    "wildcard": {
                        "readable_id": {
                            "value": f"{text.upper()}*",
                            "rewrite": "constant_score",
                        }
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
            ]
        }
    else:
        text_query = {}

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
                    filter_clauses_for_filter.append(
                        {
                            "term": {
                                search_filter: {
                                    "value": option,
                                    "case_insensitive": True,
                                }
                            }
                        }
                    )

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

    indexes = relevant_indexes(
        search_params.get("resource_type"), search_params.get("aggregations")
    )
    search = Search(index=",".join(indexes))

    search = search.source(
        fields={
            "excludes": [
                *OSLearningResourceSerializer.SOURCE_EXCLUDED_FIELDS,
            ]
        }
    )

    if search_params.get("offset"):
        search = search.extra(from_=search_params.get("offset"))

    if search_params.get("limit"):
        search = search.extra(size=search_params.get("limit"))

    if search_params.get("sortby"):
        sort = generate_sort_clause(search_params.get("sortby"))

        search = search.sort(sort)

    if search_params.get("q"):
        text = re.sub("[\u201c\u201d]", '"', search_params.get("q"))
        text_query = generate_text_clause(text)
        suggest = generate_suggest_clause(text)
        search = search.query("bool", should=[text_query])
        search = search.extra(suggest=suggest)

    filter_clauses = generate_filter_clauses(search_params)
    if filter_clauses:
        search = search.post_filter("bool", must=list(filter_clauses.values()))

    if search_params.get("aggregations"):
        aggregation_clauses = generate_aggregation_clauses(
            search_params, filter_clauses
        )
        search = search.extra(aggs=aggregation_clauses)

    return search.execute().to_dict()
