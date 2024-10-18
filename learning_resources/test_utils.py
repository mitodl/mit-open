"""Test utility functions for learning resources."""

from data_fixtures.utils import upsert_topic_data_file
from learning_resources.factories import LearningResourceOfferorFactory


def set_up_topics(**kwargs):
    """
    Set up topics and create an MITx Online offeror so mappings work too.

    The keyword args should match the options for the
    LearningResourceOfferorFactory (i.e. is_mitx, is_see, etc.)
    """

    LearningResourceOfferorFactory.create(**kwargs)
    upsert_topic_data_file()
