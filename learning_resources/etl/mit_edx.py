"""MIT edX ETL"""

import csv
import logging

from django.conf import settings
from django.utils.functional import SimpleLazyObject
from toolz import compose, curried

from learning_resources.constants import OfferedBy, PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.openedx import (
    MIT_OWNER_KEYS,
    OpenEdxConfiguration,
    openedx_extract_transform_factory,
)

log = logging.getLogger()


def _is_mit_course(course):
    """
    Helper function to determine if a course is an MIT course

    Args:
        course (dict): The JSON object representing the course with all its course runs

    Returns:
        bool: indicates whether the course is owned by MIT
    """  # noqa: D401
    return any(owner["key"] in MIT_OWNER_KEYS for owner in course.get("owners"))


def _load_edx_topic_mappings():
    """
    Loads the topic mappings from the crosswalk CSV file

    Returns:
        dict:
            the mapping dictionary
    """  # noqa: D401
    with open(  # noqa: PTH123
        "learning_resources/data/edx-topic-mappings.csv"
    ) as mapping_file:
        # drop the column headers (first row)
        # assumes the csv is in "source topic, dest target" format
        return dict(list(csv.reader(mapping_file))[1:])


EDX_TOPIC_MAPPINGS = SimpleLazyObject(_load_edx_topic_mappings)


def _remap_mit_edx_topics(course):
    """
    Remap MIT edX topics using a crosswalk csv, excluding topics that don't appear in the mapping

    Args:
        course (dict): The JSON object representing the course with all its course runs

    Returns:
        dict:
            the course with the remapped topics
    """  # noqa: E501
    topics = []
    for topic in course.get("topics", []):
        topic_name = topic["name"]
        mapped_topic_name = EDX_TOPIC_MAPPINGS.get(topic_name, None)

        if mapped_topic_name is None:
            log.info(
                "Failed to map mitx topic '%s' for course '%s'",
                topic_name,
                course["readable_id"],
            )
            continue

        topics.append({"name": mapped_topic_name})

    return {**course, "topics": topics}


def get_open_edx_config():
    """
    Return the OpenEdxConfiguration for edX.
    """
    required_settings = [
        "EDX_API_CLIENT_ID",
        "EDX_API_CLIENT_SECRET",
        "EDX_API_ACCESS_TOKEN_URL",
        "EDX_API_URL",
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
        settings.EDX_API_URL,
        settings.EDX_BASE_URL,
        settings.EDX_ALT_URL,
        PlatformType.edx.name,
        OfferedBy.mitx.name,
        ETLSource.mit_edx.name,
    )


# use the OpenEdx factory to create our extract and transform funcs
extract, _transform = openedx_extract_transform_factory(get_open_edx_config)

# modified transform function that filters the course list to ones that pass the _is_mit_course() predicate  # noqa: E501
transform = compose(
    curried.map(_remap_mit_edx_topics), _transform, curried.filter(_is_mit_course)
)
