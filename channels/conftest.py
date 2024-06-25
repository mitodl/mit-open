"""Common fixtures and functions for channels tests"""

import pytest

from channels.factories import ChannelFactory


@pytest.fixture()
def field_channel():
    """Generate a sample Channel"""
    return ChannelFactory.create()
