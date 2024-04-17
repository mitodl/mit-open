"""API for general search-related functionality"""

import re
from collections import Counter

from opensearch_dsl import Search
from opensearch_dsl.query import MoreLikeThis

from learning_resources.constants import LEARNING_RESOURCE_SORTBY_OPTIONS
from learning_resources_search.connection import get_default_alias_name
from learning_resources_search.constants import (
    CONTENT_FILE_TYPE,
    COURSE_QUERY_FIELDS,
    COURSE_TYPE,
    DEPARTMENT_QUERY_FIELDS,
    LEARNING_RESOURCE,
    LEARNING_RESOURCE_QUERY_FIELDS,
    LEARNING_RESOURCE_SEARCH_FILTERS,
    LEARNING_RESOURCE_TYPES,
    RESOURCEFILE_QUERY_FIELDS,
    RUN_INSTRUCTORS_QUERY_FIELDS,
    RUNS_QUERY_FIELDS,
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


def relevant_indexes(resource_types, aggregations, endpoint):
    """
    Return list of relevent index type for the query

    Args:
        resource_types (list): the resource type parameter for the search
        aggregations (list): the aggregations parameter for the search
        endpoint (string): the endpoint: learning_resource or content_file

    Returns:
        Array(string): array of index names

    """
    if endpoint == CONTENT_FILE_TYPE:
        return [get_default_alias_name(COURSE_TYPE)]

    if aggregations and "resource_type" in aggregations:
        return map(get_default_alias_name, LEARNING_RESOURCE_TYPES)

    return map(get_default_alias_name, set(resource_types))


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


def generate_filter_clause(
    path: str, value: str, *, case_sensitive: bool, _current_path_length=1
):
    """
    Generate search clause for a single filter path abd value.

    Args:
        path (str): Search index on which to filter
        value (str): Value of filter
        case_sensitive(bool): Whether to match value case-sensitively or not

    Returns:
        An OpenSearch query clause for use in filtering.

    NOTE: Paths with periods are assumed to be nested. E.g., path='a.b.c' will
    generate a doubly-nested query clause.
    """
    path_pieces = path.split(".")
    current_path = ".".join(path_pieces[0:_current_path_length])
    if current_path == path:
        case_sensitivity = {} if case_sensitive else {"case_insensitive": True}
        return {"term": {path: {"value": value, **case_sensitivity}}}

    return {
        "nested": {
            "path": current_path,
            "query": generate_filter_clause(
                path,
                value,
                case_sensitive=case_sensitive,
                _current_path_length=_current_path_length + 1,
            ),
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
    all_filter_clauses = {}

    for filter_name, filter_config in LEARNING_RESOURCE_SEARCH_FILTERS.items():
        if search_params.get(filter_name):
            clauses_for_filter = [
                generate_filter_clause(
                    filter_config.path,
                    filter_value,
                    case_sensitive=filter_config.case_sensitive,
                )
                for filter_value in search_params.get(filter_name)
            ]

            all_filter_clauses[filter_name] = {"bool": {"should": clauses_for_filter}}

    return all_filter_clauses


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


def generate_aggregation_clause(
    aggregation_name: str, path: str, _current_path_length=1
):
    """
    Generate a search aggregation clause for a search query.

    Args:
        aggregation_name (str): name of aggregation
        path (str): Search index on which to aggregate

    Returns:
        An OpenSearch query clause for use in aggregation.

    NOTE: Properties with periods are assumed to be nested. E.g., path='a.b.c'
    will generate a doubly-nested query clause.
    """
    path_pieces = path.split(".")
    current_path = ".".join(path_pieces[0:_current_path_length])

    if current_path == path:
        bucket_agg = {"terms": {"field": path, "size": 10000}}
        if _current_path_length == 1:
            return bucket_agg
        else:
            # In case of nested aggregations, use reverse_nested to return the
            # root document count to avoid overcounting. For example, a resource
            # with 5 runs all with level high_school would otherwise count 5
            # times toward a level aggregation.
            #
            # Strictly speaking, this is only necessary for fields that may
            # contain arrays with duplicated field values.
            return {**bucket_agg, "aggs": {"root": {"reverse_nested": {}}}}

    return {
        "nested": {"path": current_path},
        "aggs": {
            aggregation_name: generate_aggregation_clause(
                aggregation_name, path, _current_path_length + 1
            )
        },
    }


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
            path = LEARNING_RESOURCE_SEARCH_FILTERS[aggregation].path
            unfiltered_aggs = generate_aggregation_clause(aggregation, path)
            other_filters = [
                filter_clauses[key] for key in filter_clauses if key != aggregation
            ]

            if other_filters:
                aggregation_clauses[aggregation] = {
                    "aggs": {aggregation: unfiltered_aggs},
                    "filter": {"bool": {"must": other_filters}},
                }
            else:
                aggregation_clauses[aggregation] = unfiltered_aggs

    return aggregation_clauses


def construct_search(search_params):
    """
    Construct a learning resources search based on the query


    Args:
        search_params (dict): The opensearch query params returned from
        LearningResourcesSearchRequestSerializer

    Returns:
        opensearch_dsl.Search: an opensearch search instance
    """

    if (
        not search_params.get("resource_type")
        and search_params.get("endpoint") != CONTENT_FILE_TYPE
    ):
        search_params["resource_type"] = list(LEARNING_RESOURCE_TYPES)

    indexes = relevant_indexes(
        search_params.get("resource_type"),
        search_params.get("aggregations"),
        search_params.get("endpoint"),
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

    if search_params.get("endpoint") == CONTENT_FILE_TYPE:
        query_type_query = {"exists": {"field": "content_type"}}
    else:
        query_type_query = {"exists": {"field": "resource_type"}}

    if search_params.get("q"):
        text = re.sub("[\u201c\u201d]", '"', search_params.get("q"))
        if search_params.get("endpoint") == CONTENT_FILE_TYPE:
            text_query = generate_content_file_text_clause(text)
        else:
            text_query = generate_learning_resources_text_clause(text)

        suggest = generate_suggest_clause(text)
        search = search.query("bool", must=[text_query], filter=query_type_query)
        search = search.extra(suggest=suggest)
    else:
        search = search.query(query_type_query)

    filter_clauses = generate_filter_clauses(search_params)

    search = search.post_filter("bool", must=list(filter_clauses.values()))

    if search_params.get("aggregations"):
        aggregation_clauses = generate_aggregation_clauses(
            search_params, filter_clauses
        )
        search = search.extra(aggs=aggregation_clauses)

    return search


def execute_learn_search(search_params):
    """
    Execute a learning resources search based on the query


    Args:
        search_params (dict): The opensearch query params returned from
        LearningResourcesSearchRequestSerializer

    Returns:
        dict: The opensearch response dict
    """

    search = construct_search(search_params)

    return search.execute().to_dict()


def subscribe_user_to_search_query(user, search_params):
    from learning_resources_search.models import PercolateQuery

    """
    Subscribe a user to a search query


    Args:
        user: The User to subscribe
        search_params (dict): The opensearch query params returned from
        LearningResourcesSearchRequestSerializer

    Returns:
        dict: The opensearch response dict
    """

    percolate_query, _ = PercolateQuery.objects.get_or_create(
        source_type=PercolateQuery.SEARCH_SUBSCRIPTION_TYPE,
        original_query=search_params,
    )
    if not percolate_query.users.filter(id=user.id).exists():
        percolate_query.users.add(user)
    return percolate_query.query


def unsubscribe_user_to_search_query(user, search_params):
    from learning_resources_search.models import PercolateQuery

    """
    Unsubscribe a user to a search query


    Args:
        user: The User to unsubscribe
        search_params (dict): The opensearch query params returned from
        LearningResourcesSearchRequestSerializer

    Returns:
        dict: The opensearch response dict
    """
    percolate_query, _ = PercolateQuery.objects.get_or_create(
        source_type=PercolateQuery.SEARCH_SUBSCRIPTION_TYPE,
        original_query=search_params,
    )
    if percolate_query.users.filter(id=user.id).exists():
        percolate_query.users.remove(user)
    return percolate_query.query


def user_subscribed_to_query(user, search_params):
    from learning_resources_search.models import PercolateQuery

    """
    Check if a user is subscribed to a search query


    Args:
        user: The User to check
        search_params (dict): The opensearch query params returned from
        LearningResourcesSearchRequestSerializer

    Returns:
        bool: Whether or not the user has subscribed to the query
    """
    try:
        percolate_query = PercolateQuery.objects.get(
            source_type=PercolateQuery.SEARCH_SUBSCRIPTION_TYPE,
            original_query=search_params,
        )
        return percolate_query.users.filter(id=user.id).exists()
    except PercolateQuery.DoesNotExist:
        return False


def get_similar_topics(
    value_doc: dict, num_topics: int, min_term_freq: int, min_doc_freq: int
) -> list[str]:
    """
    Get a list of similar topics based on text values

    Args:
        value_doc (dict):
            a document representing the data fields we want to search with
        num_topics (int):
            number of topics to return
        min_term_freq (int):
            minimum times a term needs to show up in input
        min_doc_freq (int):
            minimum times a term needs to show up in docs

    Returns:
        list of str:
            list of topic values
    """
    indexes = relevant_indexes([COURSE_TYPE], [], endpoint=LEARNING_RESOURCE)
    search = Search(index=",".join(indexes))
    search = search.filter("term", resource_type=COURSE_TYPE)
    search = search.query(
        MoreLikeThis(
            like=[{"doc": value_doc, "fields": list(value_doc.keys())}],
            fields=[
                "course.course_numbers.value",
                "title",
                "description",
                "full_description",
            ],
            min_term_freq=min_term_freq,
            min_doc_freq=min_doc_freq,
        )
    )
    search = search.source(includes="topics")

    response = search.execute()

    topics = [topic.to_dict()["name"] for hit in response.hits for topic in hit.topics]

    counter = Counter(topics)
    return list(dict(counter.most_common(num_topics)).keys())
