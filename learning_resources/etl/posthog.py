"""PostHog ETL"""

import dataclasses
import json
import logging
from collections.abc import Generator
from datetime import datetime
from http import HTTPStatus
from typing import Optional
from urllib.parse import urljoin

import pytz
import requests
from django.conf import settings

from learning_resources.exceptions import PostHogAuthenticationError, PostHogQueryError
from learning_resources.models import LearningResource, LearningResourceViewEvent

log = logging.getLogger(__name__)


@dataclasses.dataclass
class PostHogEvent:
    """
    Represents the raw event data returned by a HogQL query.

    This isn't specific to the lrd_view event. There are some elemnts to this
    that start with a $, so here they're prefixed with "dollar_". Many of these
    are optional so we can query just for the most salient columns later.
    """

    uuid: str
    event: str
    properties: str
    timestamp: datetime
    distinct_id: Optional[str] = None
    elements_chain: Optional[str] = None
    created_at: Optional[datetime] = None
    dollar_session_id: Optional[str] = None
    dollar_window_id: Optional[str] = None
    dollar_group_0: Optional[str] = None
    dollar_group_1: Optional[str] = None
    dollar_group_2: Optional[str] = None
    dollar_group_3: Optional[str] = None
    dollar_group_4: Optional[str] = None


@dataclasses.dataclass
class PostHogLearningResourceViewEvent:
    """
    Represents a learning resource view (lrd_view) event.

    PostHog event properties include a lot of other stuff - this just includes
    the lrd_view specific properties.
    """

    resourceType: str  # noqa: N815
    platformCode: str  # noqa: N815
    resourceId: int  # noqa: N815
    readableId: str  # noqa: N815
    event_date: datetime


class PostHogApiAuth(requests.auth.AuthBase):
    """Implements Bearer authentication for the PostHog private API"""

    def __init__(self, token):
        """Store the passed-in token."""

        self.token = token

    def __call__(self, request):
        """Add the bearer token to the headers."""

        request.headers["Authorization"] = f"Bearer {self.token}"
        return request


def posthog_run_query(query: str) -> dict:
    """
    Run a HogQL query agains the PostHog private API.

    A personal API key is required for this to work. The project key is not
    sufficient.

    This will format the payload for you - just specify the actual HogQL query
    here.

    Args:
    - query (str): the HogQL query to run
    Returns:
    - dict, the de-JSONified data from PostHog
    """

    ph_api_key = settings.POSTHOG_PERSONAL_API_KEY or None
    ph_root_endpoint = settings.POSTHOG_API_HOST or None
    ph_project_id = settings.POSTHOG_PROJECT_ID or None

    if ph_api_key is None:
        error = "No PostHog personal API key configured."
        raise AttributeError(error)

    if ph_root_endpoint is None:
        error = "No PostHog API endpoint configured."
        raise AttributeError(error)

    if ph_project_id is None:
        error = "No PostHog project ID."
        raise AttributeError(error)

    ph_query_endpoint = urljoin(ph_root_endpoint, f"api/projects/{ph_project_id}/query")

    query_body = {"query": {"kind": "HogQLQuery", "query": query}}

    query_result = requests.post(
        ph_query_endpoint,
        json=query_body,
        auth=PostHogApiAuth(ph_api_key),
        timeout=1500,
    )

    if query_result.status_code >= HTTPStatus.BAD_REQUEST.value:
        log.error("PostHog query API returned an error: %s", query_result.status_code)

        error_result = query_result.json()

        if "type" in error_result and error_result["type"] == "authentication_error":
            raise PostHogAuthenticationError(error_result)

        raise PostHogQueryError(error_result)

    return query_result.json()


def posthog_extract_lrd_view_events() -> Generator[PostHogEvent, None, None]:
    """
    Retrieve lrd_view events from the PostHog Query API.

    This will filter results based on the last record retrieved:
    - If there are any stored events, the query will start after the last event
      date
    - If there aren't any stored events, no filter is applied and you will get
      all events to date

    Due to limitations on the PostHog API side, this converts the last event
    date explicitly to UTC and then to a naive datetime. The PostHog query
    processor doesn't like timezone info and expects UTC.

    Returns:
    - Generator that yields PostHogEvent
    """

    last_event = LearningResourceViewEvent.objects.order_by("-event_date").first()

    if last_event:
        last_event_day = (
            last_event.event_date.astimezone(pytz.utc).replace(tzinfo=None).isoformat()
        )

        query = (
            "select uuid, event, properties, timestamp from events where "  # noqa: S608
            f"timestamp > '{last_event_day}'"
        )
    else:
        query = "select uuid, event, properties, timestamp from events"

    int_query = "{} limit {} offset {}"

    limit = 100
    offset = 0
    has_next_page = True

    def _run_query() -> dict:
        return posthog_run_query(int_query.format(query, limit, offset))

    results = _run_query()

    cols = results["columns"]

    while has_next_page:
        for result in results["results"]:
            formatted_result = {}

            for i, column in enumerate(cols):
                formatted_result[column.replace("$", "dollar_")] = result[i]

            yield PostHogEvent(**formatted_result)

        if len(results["results"]) == limit:
            offset += limit
            results = _run_query()
        else:
            has_next_page = False


def posthog_transform_lrd_view_events(
    events: iter,
) -> Generator[PostHogLearningResourceViewEvent, None, None]:
    """
    Transform PostHogEvents into PostHogLearningResourceViewEvents.

    Args:
    - events (list[PostHogEvent]) - list of events to process
    Returns:
    Generator that yields PostHogLearningResourceViewEvent
    """

    for result in events:
        props = json.loads(result.properties)

        yield PostHogLearningResourceViewEvent(
            resourceType=props.get("resourceType", ""),
            platformCode=props.get("platformCode", ""),
            resourceId=props.get("resourceId", ""),
            readableId=props.get("readableId", ""),
            event_date=result.timestamp,
        )


def load_posthog_lrd_view_event(
    event: PostHogLearningResourceViewEvent,
) -> LearningResourceViewEvent | None:
    """
    Load a PostHogLearningResourceViewEvent into the database.

    Args:
    - event (PostHogLearningResourceViewEvent): the event to load
    Returns:
    LearningResourceViewEvent of the event
    """

    try:
        learning_resource = LearningResource.objects.filter(pk=event.resourceId).get()
    except LearningResource.DoesNotExist:
        skip_warning = (
            f"WARNING: skipping event for resource ID {event.resourceId}"
            " - resource not found"
        )
        log.warning(skip_warning)
        return None
    except LearningResource.MultipleObjectsReturned:
        skip_warning = (
            f"WARNING: skipping event for resource ID {event.resourceId}"
            " - multiple objects returned"
        )
        log.warning(skip_warning)
        return None
    except ValueError:
        skip_warning = (
            f"WARNING: skipping event for resource ID {event.resourceId}"
            " - invalid ID"
        )
        log.warning(skip_warning)
        return None

    lr_event, _ = LearningResourceViewEvent.objects.update_or_create(
        learning_resource=learning_resource,
        event_date=event.event_date,
        defaults={
            "learning_resource": learning_resource,
            "event_date": event.event_date,
        },
    )

    return lr_event


def load_posthog_lrd_view_events(
    events: iter,
) -> list[LearningResourceViewEvent]:
    """
    Load a list of PostHogLearningResourceViewEvent into the database.

    Args:
    - events (list[PostHogLearningResourceViewEvent]): the events to load
    Returns:
    List of LearningResourceViewEvent
    """

    return [load_posthog_lrd_view_event(event) for event in events]
