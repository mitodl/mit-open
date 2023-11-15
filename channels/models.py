"""Models for channels"""

from django.contrib.auth.models import Group
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import JSONField, deletion
from imagekit.models import ImageSpecField, ProcessedImageField
from imagekit.processors import ResizeToFit

from channels.constants import FIELD_ROLE_CHOICES
from learning_resources.models import LearningResource
from open_discussions.models import TimestampedModel
from profiles.utils import avatar_uri, banner_uri
from widgets.models import WidgetList

AVATAR_SMALL_MAX_DIMENSION = 22
AVATAR_MEDIUM_MAX_DIMENSION = 90


class BaseChannel(models.Model):
    """Base abstract model for channels"""

    # Channel configuration
    name = models.CharField(
        max_length=100,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[A-Za-z0-9_]+$",
                message=(
                    "Channel name can only contain the characters: A-Z, a-z, 0-9, _"
                ),
            )
        ],
    )
    title = models.CharField(max_length=100)

    # Branding fields
    avatar = ProcessedImageField(
        null=True, blank=True, max_length=2083, upload_to=avatar_uri
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
    banner = ProcessedImageField(
        null=True, blank=True, max_length=2083, upload_to=banner_uri
    )
    about = JSONField(blank=True, null=True)

    # Miscellaneous fields
    ga_tracking_id = models.CharField(max_length=24, blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        """Str representation of channel"""
        return self.title


class FieldChannel(BaseChannel, TimestampedModel):
    """Field of study"""

    public_description = models.TextField(blank=True, default="")

    featured_list = models.ForeignKey(
        LearningResource, null=True, blank=True, on_delete=deletion.SET_NULL
    )

    widget_list = models.ForeignKey(
        WidgetList,
        on_delete=models.SET_NULL,
        null=True,
        related_name="field_channel",
    )


class FieldList(TimestampedModel):
    """LearningPath and position (list order) for a field channel"""

    field_list = models.ForeignKey(LearningResource, on_delete=models.CASCADE)
    field_channel = models.ForeignKey(
        FieldChannel, related_name="lists", on_delete=models.CASCADE
    )
    position = models.IntegerField(default=0)

    class Meta:
        unique_together = (("field_list", "field_channel"),)
        ordering = ["position"]


class Subfield(TimestampedModel):
    """Subfield and position for a parent field channel"""

    field_channel = models.ForeignKey(FieldChannel, on_delete=models.CASCADE)
    parent_channel = models.ForeignKey(
        FieldChannel, on_delete=models.CASCADE, related_name="subfields"
    )
    position = models.IntegerField(default=0)

    class Meta:
        unique_together = (("field_channel", "parent_channel"),)


class FieldChannelGroupRole(TimestampedModel):
    """
    Keep track of field moderators
    """

    field = models.ForeignKey(FieldChannel, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=48, choices=zip(FIELD_ROLE_CHOICES, FIELD_ROLE_CHOICES)
    )

    class Meta:
        unique_together = (("field", "group", "role"),)
        index_together = (("field", "role"),)

    def __str__(self):
        return f"Group {self.group.name} role {self.role} for FieldChannel {self.field.name}"  # noqa: E501
