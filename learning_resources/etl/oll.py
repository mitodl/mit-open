"""MITx learning_resources ETL"""

import logging

from django.conf import settings

from learning_resources.constants import OfferedBy, PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.openedx import (
    OpenEdxConfiguration,
    openedx_extract_transform_factory,
)

log = logging.getLogger(__name__)


def get_open_edx_config():
    """
    Return the OpenEdxConfiguration for edX.
    """
    required_settings = [
        "OLL_API_CLIENT_ID",
        "OLL_API_CLIENT_SECRET",
        "OLL_API_ACCESS_TOKEN_URL",
        "OLL_API_URL",
        "OLL_BASE_URL",
        "OLL_ALT_URL",
    ]
    for setting in required_settings:
        if not getattr(settings, setting):
            log.warning("Missing required setting %s", setting)
    return OpenEdxConfiguration(
        settings.OLL_API_CLIENT_ID,
        settings.OLL_API_CLIENT_SECRET,
        settings.OLL_API_ACCESS_TOKEN_URL,
        settings.OLL_API_URL,
        settings.OLL_BASE_URL,
        settings.OLL_ALT_URL,
        PlatformType.oll.name,
        OfferedBy.mitx.name,
        ETLSource.oll.name,
    )


# use the OpenEdx factory to create our extract and transform funcs
extract, transform = openedx_extract_transform_factory(get_open_edx_config)
