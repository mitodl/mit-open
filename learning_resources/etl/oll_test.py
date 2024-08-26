"""Tests for the OLL ETL functions"""

# pylint: disable=redefined-outer-name
import json

import pytest

from learning_resources.etl.oll import transform


@pytest.fixture
def oll_course_data():
    """Fixture for valid OLL catalog data"""
    with open("./test_json/test_oll_courses.json") as f:  # noqa: PTH123
        return json.loads(f.read())


def test_oll_transform(oll_course_data):
    """Verify that courses with non-MIT owners are filtered out"""
    results = list(transform(oll_course_data["results"]))
    assert len(results) == 1

    for course in results:
        assert len(course["runs"]) == 1
        for run in course["runs"]:
            assert run["prices"] == ["0.00"]
