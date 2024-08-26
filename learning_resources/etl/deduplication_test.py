"""Tests for the deduplication ETL functions"""

from datetime import UTC, datetime

import pytest

from learning_resources.constants import RunStatus
from learning_resources.etl.deduplication import get_most_relevant_run
from learning_resources.factories import LearningResourceRunFactory
from learning_resources.models import LearningResourceRun


@pytest.mark.django_db()
def test_get_most_relevant_run():
    """Verify that most_relevant_run returns the correct run"""

    most_relevant_run = LearningResourceRunFactory.create(
        availability=RunStatus.archived.value,
        start_date=datetime(2019, 10, 1, tzinfo=UTC),
        run_id="1",
    )
    LearningResourceRunFactory.create(
        availability=RunStatus.archived.value,
        start_date=datetime(2018, 10, 1, tzinfo=UTC),
        run_id="2",
    )

    assert (
        get_most_relevant_run(LearningResourceRun.objects.filter(run_id__in=["1", "2"]))
        == most_relevant_run
    )

    most_relevant_run = LearningResourceRunFactory.create(
        availability=RunStatus.upcoming.value,
        start_date=datetime(2017, 10, 1, tzinfo=UTC),
        run_id="3",
    )

    LearningResourceRunFactory.create(
        availability=RunStatus.upcoming.value,
        start_date=datetime(2020, 10, 1, tzinfo=UTC),
        run_id="4",
    )

    assert (
        get_most_relevant_run(
            LearningResourceRun.objects.filter(run_id__in=["1", "2", "3", "4"])
        )
        == most_relevant_run
    )

    most_relevant_run = LearningResourceRunFactory.create(
        availability=RunStatus.current.value, run_id="5"
    )

    assert (
        get_most_relevant_run(
            LearningResourceRun.objects.filter(run_id__in=["1", "2", "3", "4", "5"])
        )
        == most_relevant_run
    )
