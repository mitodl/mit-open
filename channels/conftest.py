"""Common fixtures and functions for channels tests"""

import pytest

from channels.factories import FieldChannelFactory


@pytest.fixture()
def field_channel():
    """Generate a sample FieldChannel"""
    return FieldChannelFactory.create()
