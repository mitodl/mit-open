"""API for general search-related functionality"""
from base64 import urlsafe_b64encode

from opensearch_dsl import Search

from learning_resources_search.connection import get_default_alias_name
from open_discussions.utils import extract_values
from search.constants import ALIAS_ALL_INDICES, VALID_OBJECT_TYPES

RELATED_POST_RELEVANT_FIELDS = ["plain_text", "post_title", "author_id", "channel_name"]
SIMILAR_RESOURCE_RELEVANT_FIELDS = ["title", "short_description"]


def gen_course_id(platform, readable_id):
    """
    Generate the OpenSearch document id for a course

    Args:
        platform (str): The platform of a LearningResource object
        course_id (str): The readable_id of a LearningResource object

    Returns:
        str: The OpenSearch document id for this object
    """
    safe_id = urlsafe_b64encode(readable_id.encode("utf-8")).decode("utf-8").rstrip("=")
    return f"co_{platform}_{safe_id}"


def gen_program_id(program_obj):
    """
    Generate the OpenSearch document id for a Program

    Args:
        program_obj (Program): The Program object

    Returns:
        str: The OpenSearch document id for this object
    """
    return f"program_{program_obj.learning_resource_id}"


def relevant_indexes(query):
    """
    Return True if the query includes learning resource types, False otherwise

    Args:
        query (dict): The query sent to opensearch

    Returns:
        Array(string): array of index names

    """
    object_types = set(extract_values(query, "object_type"))

    valid_index_types = set(VALID_OBJECT_TYPES)

    object_types = object_types.intersection(valid_index_types)

    if not object_types:
        return [get_default_alias_name(ALIAS_ALL_INDICES)]

    # if RESOURCE_FILE_TYPE in object_types:

    return map(get_default_alias_name, object_types)


def execute_learn_search(*, query):
    """
    Execute a learning resources search based on the queryq


    Args:
        query (dict): The opensearch query constructed in the frontend

    Returns:
        dict: The opensearch response dict
    """
    indexes = ",".join(relevant_indexes(query))
    search = Search(index=indexes)
    search.update_from_dict(query)
    return search.execute().to_dict()
