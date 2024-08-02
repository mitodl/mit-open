"""Test utility functions for learning resources."""

from learning_resources.factories import LearningResourceOfferorFactory
from learning_resources.utils import upsert_topic_data_file


def set_up_topics(**kwargs):
    """
    Set up topics and create an MITx Online offeror so mappings work too.

    The keyword args should match the options for the
    LearningResourceOfferorFactory (i.e. is_mitx, is_see, etc.)
    """

    LearningResourceOfferorFactory.create(**kwargs)
    upsert_topic_data_file()
