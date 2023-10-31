"""MITx learning_resources ETL"""
from django.conf import settings

from learning_resources.constants import OfferedBy, PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.openedx import (
    OpenEdxConfiguration,
    openedx_extract_transform_factory,
)

# use the OpenEdx factory to create our extract and transform funcs
extract, transform = openedx_extract_transform_factory(
    lambda: OpenEdxConfiguration(
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
)
