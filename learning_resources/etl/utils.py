from itertools import chain
from django.utils.functional import SimpleLazyObject
import csv


def _load_ucc_topic_mappings():
    """
    Loads the topic mappings from the crosswalk CSV file

    Returns:
        dict:
            the mapping dictionary
    """
    with open("learning_resources/data/ucc-topic-mappings.csv", "r") as mapping_file:
        rows = list(csv.reader(mapping_file))
        # drop the column headers (first row)
        rows = rows[1:]
        mapping = dict()
        for row in rows:
            ocw_topics = list(filter(lambda item: item, row[2:]))
            mapping[f"{row[0]}:{row[1]}"] = ocw_topics
            mapping[row[1]] = ocw_topics
        return mapping


UCC_TOPIC_MAPPINGS = SimpleLazyObject(_load_ucc_topic_mappings)


def transform_topics(topics):
    """
    Transform topics by using our crosswalk mapping

    Args:
        topics (list of dict):
            the topics to transform

    Return:
        list of dict: the transformed topics
    """
    return [
        {"name": topic_name}
        for topic_name in chain.from_iterable(
            [
                UCC_TOPIC_MAPPINGS.get(topic["name"], [topic["name"]])
                for topic in topics
                if topic is not None
            ]
        )
    ]
