"""MIT edX ETL"""

import logging

from django.conf import settings
from toolz import compose, curried

from learning_resources.constants import LearningResourceType, OfferedBy, PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.openedx import (
    MIT_OWNER_KEYS,
    OpenEdxConfiguration,
    openedx_extract_transform_factory,
)

log = logging.getLogger()


def _is_mit_program(program):
    """
    Helper function to determine if a course is an MIT course

    Args:
        course (dict): The JSON object representing the course with all its course runs

    Returns:
        bool: indicates whether the course is owned by MIT
    """  # noqa: D401
    return (
        any(
            owner["key"] in MIT_OWNER_KEYS
            for owner in program.get("authoring_organizations")
        )
        and "micromasters" not in program.get("type", "").lower()
        and program.get("status") == "active"
    )


def get_open_edx_config():
    """
    Return the OpenEdxConfiguration for edX.
    """
    required_settings = [
        "EDX_API_CLIENT_ID",
        "EDX_API_CLIENT_SECRET",
        "EDX_API_ACCESS_TOKEN_URL",
        "EDX_PROGRAMS_API_URL",
        "EDX_BASE_URL",
        "EDX_ALT_URL",
    ]
    for setting in required_settings:
        if not getattr(settings, setting):
            log.warning("Missing required setting %s", setting)
    return OpenEdxConfiguration(
        settings.EDX_API_CLIENT_ID,
        settings.EDX_API_CLIENT_SECRET,
        settings.EDX_API_ACCESS_TOKEN_URL,
        settings.EDX_PROGRAMS_API_URL,
        settings.EDX_BASE_URL,
        settings.EDX_ALT_URL,
        PlatformType.edx.name,
        OfferedBy.mitx.name,
        ETLSource.mit_edx.name,
        LearningResourceType.program.name,
    )


# use the OpenEdx factory to create our extract and transform funcs
extract, _transform = openedx_extract_transform_factory(get_open_edx_config)

# modified transform function that filters the course list to ones that pass the _is_mit_course() predicate  # noqa: E501
transform = compose(_transform, curried.filter(_is_mit_program))
