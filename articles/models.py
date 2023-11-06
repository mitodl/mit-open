"""ckeditor models"""

from django.db import models

from open_discussions.models import TimestampedModel


class Article(TimestampedModel):
    """
    Stores rich-text content created by staff members.
    """

    html = models.TextField()
    title = models.CharField(max_length=255)
