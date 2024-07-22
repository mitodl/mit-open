"""Tests for the MIT edX ETL functions"""

import copy

import pytest

from learning_resources.constants import OfferedBy
from learning_resources.etl.mit_edx import transform
from learning_resources.models import (
    LearningResourceOfferor,
    LearningResourceTopicMapping,
)

pytestmark = pytest.mark.django_db


def test_mitx_transform_non_mit_owner(non_mitx_course_data):
    """Verify that courses with non-MIT owners are filtered out"""
    assert len(list(transform(non_mitx_course_data["results"]))) == 0


def test_mitx_transform_mit_owner(mitx_course_data):
    """Verify that courses with MIT owners show up"""
    assert len(list(transform(mitx_course_data["results"]))) == 2


def test_mitx_transform_remap_topics(mocker, mitx_course_data):
    """Verify that course topics are remapped correctly"""
    mapped_topics = [
        (topic.topic_name, topic.topic.name)
        for topic in LearningResourceTopicMapping.objects.filter(
            offeror=LearningResourceOfferor.objects.filter(
                code=OfferedBy.mitx.name
            ).first()
        ).all()
    ]

    for edx_topic, expected_topic in mapped_topics:
        data = copy.deepcopy(mitx_course_data["results"])
        data[0]["subjects"] = [{"name": edx_topic}, {"name": "this topic isn't mapped"}]

        course = next(transform(data))

        assert course["topics"] == [{"name": expected_topic}]
