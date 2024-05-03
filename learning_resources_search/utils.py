from opensearch_dsl import Search

from learning_resources.hooks import get_plugin_manager


def remove_child_queries(query):
    """
    Recursively removes 'has_child'/joins from a query
    so it works with OpenSearch percolator
    """
    if isinstance(query, dict):
        if "has_child" in query:
            del query["has_child"]
            if len(query.keys()) == 0:
                return None
        new_query_dict = query.copy()
        for key, value in query.items():
            new_val = remove_child_queries(value)
            if new_val:
                new_query_dict[key] = new_val
            else:
                del new_query_dict[key]
        query = new_query_dict
    elif isinstance(query, list):
        new_query = []
        for item in query:
            stripped = remove_child_queries(item)
            if stripped:
                new_query.append(stripped)
        if len(new_query) > 0:
            query = new_query
        else:
            return None
    return query


def adjust_search_for_percolator(search):
    """
    Return an updated Search which can be used with percolator.

    Percolated queries can only store the query portion of the search object
    (see https://github.com/elastic/elasticsearch/issues/19680).
    This will modify the original search query to add post_filter arguments
    to the query part of the search. Then all parts of the Search other than query
    will be removed and has_child queries are filtered out.


    Args:
        search (Search): A search object

    Returns:
        Search: updated search object
    """
    search_dict = remove_child_queries(search.to_dict())
    if "post_filter" in search_dict:
        search = search.filter(search_dict["post_filter"])

    # Remove all other keys besides query
    updated_search_dict = {}
    search_dict = search.to_dict()
    if "query" in search_dict:
        updated_search_dict["query"] = search_dict["query"]
    updated_search = Search(index=search._index)  # noqa: SLF001
    updated_search.update_from_dict(updated_search_dict)
    return updated_search


def document_percolated_actions(resource, percolated_queries):
    """
    Trigger plugins when a LearningResource search document is percolated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.document_percolated(resource=resource, percolated_queries=percolated_queries)


def percolate_query_removed_actions(percolate_query):
    """
    Trigger plugins when a LearningResource is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.percolate_query_delete(percolate_query=percolate_query)


def percolate_query_saved_actions(percolate_query):
    """
    Trigger plugins when a LearningResource is created or updated
    """
    pm = get_plugin_manager()
    hook = pm.hook
    hook.percolate_query_upserted(percolate_query=percolate_query)
