"""
OpenSearch connection functionality
"""

import uuid
from functools import partial

from django.conf import settings
from opensearch_dsl.connections import connections

from learning_resources_search.constants import (
    ALL_INDEX_TYPES,
    IndexestoUpdate,
)


def configure_connections():
    """
    Create connections for the application

    This should only be called once
    """
    # this is the default connection
    http_auth = settings.OPENSEARCH_HTTP_AUTH
    use_ssl = http_auth is not None
    # configure() lazily creates connections when get_connection() is called
    connections.configure(
        default={
            "hosts": [settings.OPENSEARCH_URL],
            "http_auth": http_auth,
            "use_ssl": use_ssl,
            "timeout": settings.OPENSEARCH_DEFAULT_TIMEOUT,
            "connections_per_node": settings.OPENSEARCH_CONNECTIONS_PER_NODE,
            # make sure we verify SSL certificates (off by default)
            "verify_certs": use_ssl,
        }
    )


def get_conn():
    """
    Get the default connection

    Returns:
        opensearch.client.Opensearch: An OpenSearch client
    """
    return connections.get_connection()


def make_backing_index_name(object_type):
    """
    Make a unique name for use for a backing index

    Args:
        object_type(str): The object type (post, comment, profile)

    Returns:
        str: A new name for a backing index
    """
    return f"{settings.OPENSEARCH_INDEX}_{object_type}_{uuid.uuid4().hex}"


def make_alias_name(is_reindexing, object_type):
    """
    Make the name used for the Opensearch alias

    Args:
        object_type(str): The object type of the index (post, comment, etc)
        is_reindexing (bool): If true, use the alias name meant for reindexing

    Returns:
        str: The name of the alias
    """
    return "{prefix}_{object_type}_{suffix}".format(
        prefix=settings.OPENSEARCH_INDEX,
        object_type=object_type,
        suffix="reindexing" if is_reindexing else "default",
    )


get_default_alias_name = partial(make_alias_name, False)  # noqa: FBT003
get_reindexing_alias_name = partial(make_alias_name, True)  # noqa: FBT003


def get_active_aliases(
    conn, *, object_types=None, index_types=IndexestoUpdate.all_indexes.value
):
    """
    Return aliases which exist for specified object types

    Args:
        conn(opensearch.client.Opensearch): An Opensearch client
        object_types(list of str): list of object types (post, comment, etc)
        indexes(string): one of IndexestoUpdate, whether the default index,
            the reindexing index or both sould be returned for each resource type

    Returns:
        list of str: Aliases which exist
    """
    if not object_types:
        object_types = ALL_INDEX_TYPES

    if index_types == IndexestoUpdate.all_indexes.value:
        return [
            alias
            for alias_tuple in [
                (get_default_alias_name(obj), get_reindexing_alias_name(obj))
                for obj in object_types
            ]
            for alias in alias_tuple
            if conn.indices.exists(alias)
        ]

    elif index_types == IndexestoUpdate.current_index.value:
        return [
            alias
            for alias in [get_default_alias_name(obj) for obj in object_types]
            if conn.indices.exists(alias)
        ]
    elif index_types == IndexestoUpdate.reindexing_index.value:
        return [
            alias
            for alias in [get_reindexing_alias_name(obj) for obj in object_types]
            if conn.indices.exists(alias)
        ]
    return None


def refresh_index(index):
    """
    Refresh the opensearch index

    Args:
        index (str): The opensearch index to refresh
    """
    conn = get_conn()
    conn.indices.refresh(index)
