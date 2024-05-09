"""Models for testimonials."""

from django.db import models
from imagekit.models import ImageSpecField, ProcessedImageField
from imagekit.processors import ResizeToFit

from main.models import TimestampedModel
from testimonials.utils import avatar_uri, cover_uri

AVATAR_SMALL_MAX_DIMENSION = 22
AVATAR_MEDIUM_MAX_DIMENSION = 90


class Attestation(TimestampedModel):
    """Stores testimonial attestations."""

    attestant_name = models.CharField(
        max_length=200, help_text="The name of the attestant"
    )
    title = models.CharField(max_length=255, help_text="The attestant's title")
    quote = models.TextField(help_text="The testimonial attestation")
    channels = models.ManyToManyField(
        "channels.FieldChannel",
        related_name="+",
        help_text="Channels that the testimonial belongs to",
    )
    publish_date = models.DateTimeField(
        null=True, blank=True, help_text="The datetime to show the testimonial"
    )

    avatar = ProcessedImageField(
        max_length=2083, upload_to=avatar_uri, help_text="The attestant's avatar"
    )
    avatar_small = ImageSpecField(
        source="avatar",
        processors=[
            ResizeToFit(
                height=AVATAR_SMALL_MAX_DIMENSION,
                width=AVATAR_SMALL_MAX_DIMENSION,
                upscale=False,
            )
        ],
    )
    avatar_medium = ImageSpecField(
        source="avatar",
        processors=[
            ResizeToFit(
                height=AVATAR_MEDIUM_MAX_DIMENSION,
                width=AVATAR_MEDIUM_MAX_DIMENSION,
                upscale=False,
            )
        ],
    )

    cover = ProcessedImageField(
        null=True,
        blank=True,
        max_length=2083,
        upload_to=cover_uri,
        help_text="Optional cover image, only used on certain views (homepage)",
    )
