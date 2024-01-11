"""opensearch fixtures"""

from types import SimpleNamespace

import pytest

from learning_resources_search.connection import configure_connections


@pytest.fixture(autouse=True)
def opensearch(mocker, settings):
    """Fixture for mocking opensearch"""
    settings.OPENSEARCH_URL = "test.opensearch"
    mock_get_connection = mocker.patch(
        "opensearch_dsl.search.get_connection", autospec=True
    )
    configure_connections()
    return SimpleNamespace(conn=mock_get_connection.return_value)
