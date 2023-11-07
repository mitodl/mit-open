"""Exceptions for search"""

class RetryError(Exception):
    """A special exception used to signal that celery can retry this task"""


class ReindexError(Exception):
    """An error during reindexing"""
