"""Exceptions for search"""

class RetryException(Exception):  # noqa: N818
    """A special exception used to signal that celery can retry this task"""


class ReindexException(Exception):  # noqa: N818
    """An error during reindexing"""


class PopulateUserRolesException(Exception):  # noqa: N818
    """An error during populating user roles"""
