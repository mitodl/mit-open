"""PostHog ETL"""

import dataclasses
import json
import logging
from datetime import datetime
from http import HTTPStatus
from urllib.parse import urljoin

import requests
from django.conf import settings

from learning_resources.exceptions import PostHogAuthenticationError, PostHogQueryError

log = logging.getLogger(__name__)


@dataclasses.dataclass
class PostHogEvent:
    """
    Represents the raw event data returned by a HogQL query.

    This isn't specific to the lrd_view event. There are some elemnts to this
    that start with a $, so here they're prefixed with "dollar_".
    """

    uuid: str
    event: str
    properties: str
    timestamp: datetime
    distinct_id: str
    elements_chain: str
    created_at: datetime
    dollar_session_id: str
    dollar_window_id: str
    dollar_group_0: str
    dollar_group_1: str
    dollar_group_2: str
    dollar_group_3: str
    dollar_group_4: str


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


def posthog_run_query(query: str) -> list[PostHogEvent]:
    """
    Run a HogQL query agains the PostHog private API.

    A personal API key is required for this to work. The project key is not
    sufficient.

    This will format the payload for you - just specify the actual HogQL query
    here.

    Args:
    - query (str): the HogQL query to run
    Returns:
    - list of PostHogEvent
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
        error_result = query_result.json()

        if "type" in error_result and error_result["type"] == "authentication_error":
            raise PostHogAuthenticationError(error_result)

        raise PostHogQueryError(error_result)

    # PostHog returns query results with the keys separate, so now combine.

    ph_result = query_result.json()

    formatted_results = []

    for result in ph_result["results"]:
        formatted_result = {}

        for i, column in enumerate(ph_result["columns"]):
            formatted_result[column.replace("$", "dollar_")] = result[i]

        formatted_results.append(PostHogEvent(**formatted_result))

    return formatted_results


def posthog_extract_lrd_view_events(
    last_date: datetime | None = None,
) -> list[PostHogLearningResourceViewEvent]:
    """
    Retrieve a list of lrd_view events specifically.

    This has a noqa S608 in here because the HogQL stuff looks like SQL.

    But this should retrieve the last event and start from there, rather than
    get you to specify the limit time.
    """

    time_constraint = ""

    if last_date is not None:
        date_limit = last_date.date().isoformat()
        time_constraint = f" and timestamp >= '{date_limit}'"

    lrd_view_query = (
        "select * from events where event = 'lrd_view'"  # noqa: S608
        f"{time_constraint}"
    )

    query_result = posthog_run_query(lrd_view_query)

    lrd_view_events = []

    for result in query_result:
        props = json.loads(result.properties)

        lrd_view_events.append(
            PostHogLearningResourceViewEvent(
                resourceType=props["resourceType"] or "",
                platformCode=props["platformCode"] or "",
                resourceId=props["resourceId"] or "",
                readableId=props["readableId"] or "",
                event_date=result.timestamp,
            )
        )

    return lrd_view_events
