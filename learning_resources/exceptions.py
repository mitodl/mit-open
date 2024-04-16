"""Custom exceptions for learning_resources"""


class WebhookException(Exception):  # noqa: N818
    """
    To be raised in case a webhook request raises an exception
    """


class PostHogAuthenticationError(Exception):
    """Raised if the PostHog API returns an authentication error."""


class PostHogQueryError(Exception):
    """Raised if the PostHog query API returns a non-authentication error."""
