"""Models for channels"""

from django.contrib.auth.models import Group
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import JSONField, deletion
from django.db.models.functions import Concat
from imagekit.models import ImageSpecField, ProcessedImageField
from imagekit.processors import ResizeToFit

from channels.constants import CHANNEL_ROLE_CHOICES, ChannelType
from learning_resources.models import (
    LearningResource,
    LearningResourceDepartment,
    LearningResourceOfferor,
    LearningResourceTopic,
)
from main.models import TimestampedModel, TimestampedModelQuerySet
from main.utils import frontend_absolute_url
from profiles.utils import avatar_uri, banner_uri
from widgets.models import WidgetList

AVATAR_SMALL_MAX_DIMENSION = 22
AVATAR_MEDIUM_MAX_DIMENSION = 90


class ChannelQuerySet(TimestampedModelQuerySet):
    """Custom queryset for Channels"""

    def annotate_channel_url(self):
        """Annotate the channel for serialization"""
        return self.annotate(
            _channel_url=Concat(
                models.Value(frontend_absolute_url("/c/")),
                "channel_type",
                models.Value("/"),
                "name",
                models.Value("/"),
            )
        )


class Channel(TimestampedModel):
    """Channel for any field/subject"""

    objects = ChannelQuerySet.as_manager()

    # Channel configuration
    name = models.CharField(
        max_length=100,
        validators=[
            RegexValidator(
                regex=r"^[A-Za-z0-9_-]+$",
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
    channel_type = models.CharField(max_length=100, choices=ChannelType.as_tuple())
    configuration = models.JSONField(null=True, default=dict, blank=True)
    search_filter = models.CharField(max_length=2048, blank=True, default="")
    public_description = models.TextField(blank=True, default="")

    featured_list = models.ForeignKey(
        LearningResource, null=True, blank=True, on_delete=deletion.SET_NULL
    )

    widget_list = models.ForeignKey(
        WidgetList,
        on_delete=models.SET_NULL,
        null=True,
        related_name="channel",
    )

    # Miscellaneous fields
    ga_tracking_id = models.CharField(max_length=24, blank=True)

    def __str__(self):
        """Str representation of channel"""
        return self.title

    @property
    def channel_url(self) -> str:
        """Return the channel url"""
        return getattr(
            self,
            "_channel_url",
            frontend_absolute_url(f"/c/{self.channel_type}/{self.name}/"),
        )

    class Meta:
        unique_together = ("name", "channel_type")


class ChannelTopicDetail(TimestampedModel):
    """Fields specific to topic channels"""

    channel = models.OneToOneField(
        Channel,
        primary_key=True,
        on_delete=models.CASCADE,
        related_name="topic_detail",
    )
    topic = models.ForeignKey(
        LearningResourceTopic,
        null=True,
        on_delete=models.SET_NULL,
        related_name="channel_topic_details",
    )


class ChannelDepartmentDetail(TimestampedModel):
    """Fields specific to department channels"""

    channel = models.OneToOneField(
        Channel,
        primary_key=True,
        on_delete=models.CASCADE,
        related_name="department_detail",
    )
    department = models.ForeignKey(
        LearningResourceDepartment, null=True, on_delete=models.SET_NULL
    )


class ChannelUnitDetail(TimestampedModel):
    """Fields specific to unit channels"""

    channel = models.OneToOneField(
        Channel,
        primary_key=True,
        on_delete=models.CASCADE,
        related_name="unit_detail",
    )
    unit = models.ForeignKey(
        LearningResourceOfferor,
        null=True,
        on_delete=models.SET_NULL,
        related_name="channel_unit_details",
    )


class ChannelPathwayDetail(TimestampedModel):
    """Fields specific to pathway channels"""

    channel = models.OneToOneField(
        Channel,
        primary_key=True,
        on_delete=models.CASCADE,
        related_name="pathway_detail",
    )


class ChannelList(TimestampedModel):
    """LearningPath and position (list order) for a channel"""

    channel_list = models.ForeignKey(LearningResource, on_delete=models.CASCADE)
    channel = models.ForeignKey(Channel, related_name="lists", on_delete=models.CASCADE)
    position = models.IntegerField(default=0)

    class Meta:
        unique_together = (("channel_list", "channel"),)
        ordering = ["position"]


class SubChannel(TimestampedModel):
    """SubChannel and position for a parent channel"""

    channel = models.ForeignKey(Channel, on_delete=models.CASCADE)
    parent_channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="sub_channels"
    )
    position = models.IntegerField(default=0)

    class Meta:
        unique_together = (("channel", "parent_channel"),)


class ChannelGroupRole(TimestampedModel):
    """
    Keep track of channel moderators
    """

    channel = models.ForeignKey(Channel, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=48, choices=zip(CHANNEL_ROLE_CHOICES, CHANNEL_ROLE_CHOICES)
    )

    class Meta:
        unique_together = (("channel", "group", "role"),)
        index_together = (("channel", "role"),)

    def __str__(self):
        return (
            f"Group {self.group.name} role {self.role} for Channel {self.channel.name}"
        )
