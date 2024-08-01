from urllib.parse import urlparse

import pytest

from channels.constants import ChannelType
from channels.factories import (
    ChannelDepartmentDetailFactory,
    ChannelTopicDetailFactory,
    ChannelUnitDetailFactory,
)

pytestmark = [pytest.mark.django_db]


@pytest.mark.parametrize("published", [True, False])
@pytest.mark.parametrize(
    (
        "channel_type",
        "detail_factory",
    ),
    [
        (ChannelType.department, ChannelDepartmentDetailFactory),
        (ChannelType.topic, ChannelTopicDetailFactory),
        (ChannelType.unit, ChannelUnitDetailFactory),
    ],
)
def test_channel_url_for_departments(published, channel_type, detail_factory):
    """Test that the channel URL is correct for department channels"""
    channel = detail_factory.create(
        channel__published=published,
    ).channel

    if published:
        assert (
            urlparse(channel.channel_url).path
            == f"/c/{channel_type.name}/{channel.name}/"
        )
    else:
        assert channel.channel_url is None
