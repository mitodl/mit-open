"""ckeditor models"""

from django.db import models

from main.models import TimestampedModel


class Article(TimestampedModel):
    """
    Stores rich-text content created by staff members.
    """

    html = models.TextField()
    title = models.CharField(max_length=255)
