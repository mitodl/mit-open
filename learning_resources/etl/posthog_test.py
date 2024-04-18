"""Tests for the PostHog ETL library."""

import json
import uuid
from datetime import datetime

import pytest
from django.conf import settings

from learning_resources.etl import posthog
from learning_resources.models import LearningResourceViewEvent
from main.test_utils import MockResponse


def generate_fake_posthog_query_event(**kwargs):
    """
    Generate a fake PostHog query event.

    Importantly, this is not a fake PostHogEvent. This is the data that is
    present in the "results" key in the JSON payload that PostHog's query API
    sends back, which is just a straight list. If you want to specify the
    specific rows, though, use the fields names in the PostHogEvent dataclass.
    """

    # datetimes here are all naive because this is what PostHog returns.

    return [
        kwargs.get("uuid", str(uuid.uuid4())),
        kwargs.get("event", ""),
        kwargs.get("properties", ""),
        kwargs.get("timestamp", datetime.now().isoformat()),  # noqa: DTZ005
        kwargs.get("distinct_id", ""),
        kwargs.get("elements_chain", ""),
        kwargs.get("created_at", datetime.now().isoformat()),  # noqa: DTZ005
        kwargs.get("dollar_session_id", ""),
        kwargs.get("dollar_window_id", ""),
        kwargs.get("dollar_group_0", ""),
        kwargs.get("dollar_group_1", ""),
        kwargs.get("dollar_group_2", ""),
        kwargs.get("dollar_group_3", ""),
        kwargs.get("dollar_group_4", ""),
    ]


def generate_hogql_query_result(result_count: int = 5):
    """Return a faked-out HogQL result."""

    return {
        "clickhouse": "",
        "columns": [
            "uuid",
            "event",
            "properties",
            "timestamp",
            "distinct_id",
            "elements_chain",
            "created_at",
            "$session_id",
            "$window_id",
            "$group_0",
        ],
        "error": None,
        "explain": None,
        "hasMore": None,
        "hogql": "SELECT * FROM events",
        "limit": None,
        "metadata": None,
        "modifiers": {
            "dataWarehouseEventsModifiers": None,
            "inCohortVia": "subquery",
            "materializationMode": "legacy_null_as_null",
            "personsArgMaxVersion": "auto",
            "personsOnEventsMode": "person_id_override_properties_joined",
        },
        "offset": None,
        "query": None,
        "results": [generate_fake_posthog_query_event() for _ in range(result_count)],
        "timings": [],
        "types": [],
    }


@pytest.fixture()
def hogql_query_result():
    """Fixture to return a faked-out HogQL result."""

    return generate_hogql_query_result()


@pytest.mark.parametrize(
    "skip_setting", [[None], ["ph_api_key"], ["ph_root_endpoint"], ["ph_project_id"]]
)
def test_posthog_run_query(skip_setting, mocker, hogql_query_result):
    """Ensure the query runner operates properly."""

    if skip_setting == "ph_api_key":
        settings.POSTHOG_PERSONAL_API_KEY = None
        assert_string = "personal API key"

    if skip_setting == "ph_root_endpoint":
        settings.POSTHOG_API_HOST = None
        assert_string = "API endpoint"

    if skip_setting == "ph_project_id":
        settings.POSTHOG_PROJECT_ID = None
        assert_string = "project ID"

    mocked_return = MockResponse(json.dumps(hogql_query_result), 200)
    mocked_poster = mocker.patch("requests.post", return_value=mocked_return)

    if skip_setting is not None:
        result = posthog.posthog_run_query("SELECT *")

        mocked_poster.assert_called()
        assert result["results"] == hogql_query_result["results"]
    else:
        with pytest.raises(AttributeError) as exc:
            result = posthog.posthog_run_query("SELECT *")

        assert assert_string in exc


@pytest.mark.django_db()
def test_posthog_extract_lrd_view_events(mocker, hogql_query_result):
    """
    Ensure that the extractor extracts to the intermediary format.

    This should hit the PostHog API, then pull the data into PostHogEvent
    dataclasses. If we hit 100 records, it should try to fetch a second page.
    """

    LearningResourceViewEvent.objects.all().delete()

    mocked_return = MockResponse(json.dumps(hogql_query_result), 200)
    mocker.patch("requests.post", return_value=mocked_return)

    events = posthog.posthog_extract_lrd_view_events()

    for idx, event in enumerate(events):
        assert event.uuid == hogql_query_result["results"][idx][0]


@pytest.mark.django_db()
def test_posthog_extract_lrd_view_events_pagination(mocker, hogql_query_result):
    """
    Ensure that the extractor loads additional pages if it has to.

    This uses 100-item limits internally so we'll generate 100 items, then
    add in a second 100-item block at the point where it should perform another
    load.
    """

    LearningResourceViewEvent.objects.all().delete()

    hogql_query_result["results"] = all_results = [
        generate_fake_posthog_query_event() for _ in range(100)
    ]

    mocked_return = MockResponse(json.dumps(hogql_query_result), 200)
    mocked_patch = mocker.patch("requests.post", return_value=mocked_return)

    events = posthog.posthog_extract_lrd_view_events()
    mocked_patch.reset_mock()

    for idx, event in enumerate(events):
        if idx == 99:
            hogql_query_result["results"] = [
                generate_fake_posthog_query_event() for _ in range(10)
            ]
            all_results.extend(hogql_query_result["results"])
            mocked_return = MockResponse(json.dumps(hogql_query_result), 200)

        assert event.uuid == all_results[idx][0]

        if idx == 100:
            mocked_patch.assert_called_once()

    assert idx == 110
