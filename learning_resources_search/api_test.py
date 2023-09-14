# pylint: disable=redefined-outer-name,too-many-lines
"""Search API function tests"""

import pytest

from learning_resources_search.api import (
    execute_learn_search,
)
from learning_resources_search.connection import get_default_alias_name
from learning_resources_search.constants import ALIAS_ALL_INDICES, COURSE_TYPE


@pytest.mark.parametrize("has_resource_type_subquery", [True, False])
def test_execute_learn_search(opensearch, has_resource_type_subquery):
    """execute_learn_search should execute an opensearch search for learning resources"""
    opensearch.conn.search.return_value = {
        "hits": {"total": {"value": 10, "relation": "eq"}}
    }

    if has_resource_type_subquery:
        query = {"a": {"bool": {"object_type": COURSE_TYPE}}}
    else:
        query = {"a": "query"}

    assert execute_learn_search(query=query) == opensearch.conn.search.return_value

    index_type = COURSE_TYPE if has_resource_type_subquery else ALIAS_ALL_INDICES
    opensearch.conn.search.assert_called_once_with(
        body={**query},
        index=[get_default_alias_name(index_type)],
    )
