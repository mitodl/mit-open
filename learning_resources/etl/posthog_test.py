"""Tests for the PostHog ETL library."""

import json
import random
import uuid
from datetime import datetime

import pytest
from django.conf import settings
from faker import Faker

from learning_resources.etl import posthog
from learning_resources.models import LearningResourceViewEvent
from main.test_utils import MockResponse

fake = Faker()


def generate_fake_posthog_lr_properties():
    """
    Generate a fake set of properties for a PostHog event.

    This is where the data we capture in PostHog is stored. There's a bunch of
    stuff that gets captured here but this only concerns itself with the data
    that we capture.
    """

    return json.dumps(
        {
            "resourceType": fake.word(ext_word_list=["course", "program", "video"]),
            "platformCode": random.randrange(0, 9999),  # noqa: S311
            "resourceId": random.randrange(0, 9999),  # noqa: S311
            "readableId": str(uuid.uuid4()),
            "event_date": fake.date_time().isoformat(),
        }
    )


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
        kwargs.get("properties", generate_fake_posthog_lr_properties()),
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


@pytest.fixture
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


@pytest.mark.django_db
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


@pytest.mark.django_db
def test_posthog_extract_lrd_view_events_pagination(mocker):
    """
    Ensure that the extractor loads additional pages if it has to.

    This uses 100-item limits internally so we'll generate 100 items, then
    add in a second 100-item block at the point where it should perform another
    load.
    """

    LearningResourceViewEvent.objects.all().delete()

    result_1 = generate_hogql_query_result(100)
    result_2 = generate_hogql_query_result(10)

    api_call_results = [
        MockResponse(json.dumps(result_1), 200),
        MockResponse(json.dumps(result_2), 200),
    ]

    all_events = result_1["results"] + result_2["results"]

    mocked_patch = mocker.patch("requests.post", side_effect=api_call_results)

    events = posthog.posthog_extract_lrd_view_events()
    mocked_patch.reset_mock()

    stored_events = []

    for idx, event in enumerate(events):
        stored_events.append(event)
        assert event.uuid == all_events[idx][0]

    assert len(stored_events) == 110


@pytest.mark.django_db
def test_posthog_transform_lrd_view_events(mocker):
    """Ensure the second stage of the extractor loads properly"""

    LearningResourceViewEvent.objects.all().delete()

    result_1 = generate_hogql_query_result(100)
    result_2 = generate_hogql_query_result(10)

    api_call_results = [
        MockResponse(json.dumps(result_1), 200),
        MockResponse(json.dumps(result_2), 200),
    ]

    all_events = result_1["results"] + result_2["results"]

    mocker.patch("requests.post", side_effect=api_call_results)

    posthog_events = posthog.posthog_extract_lrd_view_events()

    lr_events = posthog.posthog_transform_lrd_view_events(posthog_events)

    for idx, event in enumerate(lr_events):
        props = json.loads(all_events[idx][2])
        assert event.resourceId == props["resourceId"]

    assert len(all_events) == (idx + 1)


@pytest.mark.django_db
def load_posthog_lrd_view_events(mocker):
    """Ensure the loader stage of the extractor creates database records"""

    LearningResourceViewEvent.objects.all().delete()

    result_1 = generate_hogql_query_result(100)
    result_2 = generate_hogql_query_result(10)

    api_call_results = [
        MockResponse(json.dumps(result_1), 200),
        MockResponse(json.dumps(result_2), 200),
    ]

    mocker.patch("requests.post", side_effect=api_call_results)

    posthog_events = posthog.posthog_extract_lrd_view_events()

    lr_events = posthog.posthog_transform_lrd_view_events(posthog_events)

    stored_events = load_posthog_lrd_view_events(lr_events)

    assert LearningResourceViewEvent.objects.count() == len(stored_events)
