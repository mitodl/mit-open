"""Models for learning resources and related entities"""

from decimal import Decimal

from django.contrib.admin.utils import flatten
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import JSONField
from django.db.models.functions import Lower

from learning_resources import constants
from learning_resources.constants import (
    CertificationType,
    LearningResourceFormat,
    LearningResourceRelationTypes,
    LearningResourceType,
    PrivacyLevel,
)
from main.models import TimestampedModel


def default_learning_format():
    """Return the default learning format list"""
    return [LearningResourceFormat.online.name]


class LearningResourcePlatform(TimestampedModel):
    """Platforms for all learning resources"""

    code = models.CharField(max_length=12, primary_key=True)
    name = models.CharField(max_length=256, blank=False, default="")
    url = models.URLField(null=True, blank=True)  # noqa: DJ001
    is_edx = models.BooleanField(default=False)
    has_content_files = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.code}: {self.name}"


class LearningResourceTopic(TimestampedModel):
    """
    Topics for all learning resources (e.g. "History")
    """

    name = models.CharField(max_length=128)
    parent = models.ForeignKey(
        "LearningResourceTopic",
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    def __str__(self):
        """Return the topic name."""

        return self.name

    class Meta:
        """Meta options for LearningResourceTopic"""

        constraints = [models.UniqueConstraint(Lower("name"), name="unique_lower_name")]


class LearningResourceOfferor(TimestampedModel):
    """Represents who is offering a learning resource"""

    # Old fields
    code = models.CharField(max_length=12, primary_key=True)
    name = models.CharField(max_length=256, unique=True)
    professional = models.BooleanField(default=False)

    # New fields
    offerings = ArrayField(models.CharField(max_length=128), default=list)
    audience = ArrayField(models.CharField(max_length=128), default=list)
    formats = ArrayField(models.CharField(max_length=128), default=list)
    fee = ArrayField(models.CharField(max_length=128), default=list)
    certifications = ArrayField(models.CharField(max_length=128), default=list)
    content_types = ArrayField(models.CharField(max_length=128), default=list)
    more_information = models.URLField(blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code}: {self.name}"


class LearningResourceImage(TimestampedModel):
    """Represent image metadata for a learning resource"""

    url = models.TextField(max_length=2048)
    description = models.CharField(  # noqa: DJ001
        max_length=1024, null=True, blank=True
    )
    alt = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001

    def __str__(self):
        return self.url


class LearningResourceSchool(TimestampedModel):
    """School data for a learning resource"""

    name = models.CharField(max_length=256, null=False, blank=False)
    url = models.URLField()

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class LearningResourceDepartment(TimestampedModel):
    """Department data for a learning resource"""

    department_id = models.CharField(max_length=6, primary_key=True)
    name = models.CharField(max_length=256, null=False, blank=False)
    school = models.ForeignKey(
        LearningResourceSchool,
        null=True,
        on_delete=models.SET_NULL,
        related_name="departments",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class LearningResourceContentTag(TimestampedModel):
    """Represents course feature tags and contentfile types"""

    name = models.CharField(max_length=128, unique=True)

    def __str__(self):
        return self.name


class LearningResourceInstructor(TimestampedModel):
    """
    Instructors for learning resources
    """

    first_name = models.CharField(max_length=128, null=True, blank=True)  # noqa: DJ001
    last_name = models.CharField(max_length=128, null=True, blank=True)  # noqa: DJ001
    full_name = models.CharField(max_length=256, null=True, blank=True, unique=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return self.full_name or f"{self.first_name} {self.last_name}"


class LearningResource(TimestampedModel):
    """Core model for all learning resources"""

    prefetches = [
        "topics",
        "offered_by",
        "departments",
        "departments__school",
        "content_tags",
        "runs",
        "runs__instructors",
        "runs__image",
        "children__child",
        "children__child__runs",
        "children__child__runs__instructors",
        "children__child__departments",
        "children__child__platform",
        "children__child__topics",
        "children__child__image",
        "children__child__offered_by",
        "children__child__content_tags",
        *[f"children__child__{item.name}" for item in LearningResourceType],
    ]

    related_selects = [
        "image",
        "platform",
        *([item.name for item in LearningResourceType]),
    ]

    readable_id = models.CharField(max_length=128, null=False, blank=False)
    title = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)  # noqa: DJ001
    full_description = models.TextField(null=True, blank=True)  # noqa: DJ001
    last_modified = models.DateTimeField(null=True, blank=True)
    published = models.BooleanField(default=True, db_index=True)
    languages = ArrayField(models.CharField(max_length=24), null=True, blank=True)
    url = models.URLField(null=True, max_length=2048)  # noqa: DJ001
    image = models.ForeignKey(
        LearningResourceImage, null=True, blank=True, on_delete=models.deletion.SET_NULL
    )
    learning_format = ArrayField(
        models.CharField(max_length=24, db_index=True),
        default=default_learning_format,
    )
    platform = models.ForeignKey(
        LearningResourcePlatform,
        null=True,
        blank=True,
        on_delete=models.deletion.SET_NULL,
    )
    departments = models.ManyToManyField(
        LearningResourceDepartment,
    )
    certification = models.BooleanField(default=False)
    certification_type = models.CharField(
        choices=CertificationType.as_tuple(),
        max_length=24,
        default=CertificationType.none.name,
    )
    resource_type = models.CharField(
        max_length=24,
        db_index=True,
        choices=((member.name, member.value) for member in LearningResourceType),
    )
    topics = models.ManyToManyField(LearningResourceTopic)
    offered_by = models.ForeignKey(
        LearningResourceOfferor, null=True, on_delete=models.SET_NULL
    )
    content_tags = models.ManyToManyField(LearningResourceContentTag)
    resources = models.ManyToManyField(
        "self", through="LearningResourceRelationship", symmetrical=False, blank=True
    )
    etl_source = models.CharField(max_length=12, default="")
    professional = models.BooleanField(default=False)
    next_start_date = models.DateTimeField(null=True, blank=True, db_index=True)

    @property
    def audience(self) -> str | None:
        """Returns the audience for the learning resource"""
        if self.platform:
            return self.platform.audience
        return None

    @property
    def prices(self) -> list[Decimal]:
        """Returns the prices for the learning resource"""
        if self.resource_type in [
            LearningResourceType.course.name,
            LearningResourceType.program.name,
        ]:
            return list(
                set(
                    flatten([(run.prices or [Decimal(0.0)]) for run in self.runs.all()])
                )
            )
        else:
            return [Decimal(0.00)]

    class Meta:
        unique_together = (("platform", "readable_id", "resource_type"),)


class LearningResourceRun(TimestampedModel):
    """
    Model for course and program runs
    """

    learning_resource = models.ForeignKey(
        LearningResource, related_name="runs", on_delete=models.deletion.CASCADE
    )
    run_id = models.CharField(max_length=128)
    title = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)  # noqa: DJ001
    full_description = models.TextField(null=True, blank=True)  # noqa: DJ001
    last_modified = models.DateTimeField(null=True, blank=True)
    published = models.BooleanField(default=True, db_index=True)
    languages = ArrayField(models.CharField(max_length=24), null=True, blank=True)
    url = models.URLField(null=True, max_length=2048)  # noqa: DJ001
    image = models.ForeignKey(
        LearningResourceImage, null=True, blank=True, on_delete=models.deletion.SET_NULL
    )
    level = ArrayField(
        models.CharField(max_length=128), null=False, blank=False, default=list
    )
    slug = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001
    availability = models.CharField(  # noqa: DJ001
        max_length=128, null=True, blank=True
    )
    semester = models.CharField(max_length=20, null=True, blank=True)  # noqa: DJ001
    year = models.IntegerField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    enrollment_start = models.DateTimeField(null=True, blank=True)
    enrollment_end = models.DateTimeField(null=True, blank=True)
    instructors = models.ManyToManyField(
        LearningResourceInstructor, blank=True, related_name="runs"
    )
    prices = ArrayField(
        models.DecimalField(decimal_places=2, max_digits=12), null=True, blank=True
    )
    checksum = models.CharField(max_length=32, null=True, blank=True)  # noqa: DJ001

    def __str__(self):
        return f"LearningResourceRun platform={self.learning_resource.platform} run_id={self.run_id}"  # noqa: E501

    class Meta:
        unique_together = (("learning_resource", "run_id"),)


class Course(TimestampedModel):
    """Model for representing a course"""

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="course",
        on_delete=models.deletion.CASCADE,
        primary_key=True,
    )
    course_numbers = JSONField(null=True, blank=True)

    @property
    def runs(self):
        """Get the parent LearningResource runs"""
        return self.learning_resource.runs


class Program(TimestampedModel):
    """
    A program is essentially a list of courses.
    There is nothing specific to programs at this point, but the relationship between
    programs and courses may end up being Program->Courses instead of an LR-LR relationship.
    """  # noqa: E501

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="program",
        on_delete=models.deletion.CASCADE,
        primary_key=True,
    )

    @property
    def runs(self):
        """Get the parent LearningResource runs"""
        return self.learning_resource.runs

    @property
    def courses(self):
        """Get the associated resources (should all be courses)"""
        return self.learning_resource.children


class LearningPath(TimestampedModel):
    """
    Model for representing a publishable list of  learning resources
    The LearningResource readable_id should probably be something like an auto-generated UUID.
    """  # noqa: E501

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="learning_path",
        on_delete=models.CASCADE,
    )
    author = models.ForeignKey(
        User, related_name="learning_paths", on_delete=models.PROTECT
    )

    def __str__(self):
        return f"Learning Path: {self.learning_resource.title}"


class LearningResourceRelationship(TimestampedModel):
    """
    LearningResourceRelationship model tracks the relationships between learning resources,
    for example: course LR's in a program LR, all LR's included in a LearningList LR, etc.
    """  # noqa: E501

    parent = models.ForeignKey(
        LearningResource, on_delete=models.deletion.CASCADE, related_name="children"
    )
    child = models.ForeignKey(
        LearningResource, related_name="parents", on_delete=models.deletion.CASCADE
    )
    position = models.PositiveIntegerField(default=0)

    relation_type = models.CharField(
        max_length=max(map(len, LearningResourceRelationTypes.values)),
        choices=LearningResourceRelationTypes.choices,
        default=None,
    )


class ContentFile(TimestampedModel):
    """
    ContentFile model for LearningResourceRun files
    """

    uid = models.CharField(max_length=36, null=True, blank=True)  # noqa: DJ001
    key = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001
    run = models.ForeignKey(
        LearningResourceRun, related_name="content_files", on_delete=models.CASCADE
    )
    title = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001
    description = models.TextField(null=True, blank=True)  # noqa: DJ001
    image_src = models.URLField(null=True, blank=True)  # noqa: DJ001

    url = models.TextField(null=True, blank=True)  # noqa: DJ001
    file_type = models.CharField(max_length=128, null=True, blank=True)  # noqa: DJ001

    content = models.TextField(null=True, blank=True)  # noqa: DJ001
    content_title = models.CharField(  # noqa: DJ001
        max_length=1024, null=True, blank=True
    )
    content_author = models.CharField(  # noqa: DJ001
        max_length=1024, null=True, blank=True
    )
    content_language = models.CharField(  # noqa: DJ001
        max_length=24, null=True, blank=True
    )
    content_type = models.CharField(
        choices=constants.VALID_COURSE_CONTENT_CHOICES,
        default=constants.CONTENT_TYPE_FILE,
        max_length=10,
    )
    content_tags = models.ManyToManyField(LearningResourceContentTag)
    published = models.BooleanField(default=True)
    checksum = models.CharField(max_length=32, null=True, blank=True)  # noqa: DJ001

    class Meta:
        unique_together = (("key", "run"),)
        verbose_name = "contentfile"


class UserList(TimestampedModel):
    """
    Similar in concept to a LearningPath: a list of learning resources.
    However, UserLists are not considered LearningResources because they
    should only be accessible to the user who created them.
    """

    author = models.ForeignKey(
        User, on_delete=models.deletion.CASCADE, related_name="user_lists"
    )
    title = models.CharField(max_length=256)
    description = models.TextField(default="", blank=True)
    topics = models.ManyToManyField(LearningResourceTopic)
    resources = models.ManyToManyField(
        LearningResource, through="UserListRelationship", symmetrical=False, blank=True
    )
    privacy_level = models.CharField(
        max_length=24,
        default=PrivacyLevel.private.value,
        choices=tuple((level.value, level.value) for level in PrivacyLevel),
    )


class UserListRelationship(TimestampedModel):
    """
    UserListRelationship model tracks the resources belonging to a UserList
    and their relative positions in the list.
    """

    parent = models.ForeignKey(
        UserList, on_delete=models.deletion.CASCADE, related_name="children"
    )
    child = models.ForeignKey(
        LearningResource, related_name="user_lists", on_delete=models.deletion.CASCADE
    )
    position = models.PositiveIntegerField(default=0)


class Podcast(TimestampedModel):
    """Data model for podcasts"""

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="podcast",
        on_delete=models.CASCADE,
    )
    apple_podcasts_url = models.URLField(null=True, max_length=2048)  # noqa: DJ001
    google_podcasts_url = models.URLField(null=True, max_length=2048)  # noqa: DJ001
    rss_url = models.URLField(null=True, max_length=2048)  # noqa: DJ001

    def __str__(self):
        return f"Podcast {self.id}"

    class Meta:
        ordering = ("id",)


class PodcastEpisode(TimestampedModel):
    """Data model for podcast episodes"""

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="podcast_episode",
        on_delete=models.CASCADE,
    )

    transcript = models.TextField(blank=True, default="")
    episode_link = models.URLField(null=True, max_length=2048)  # noqa: DJ001
    duration = models.CharField(null=True, blank=True, max_length=10)  # noqa: DJ001
    rss = models.TextField(null=True, blank=True)  # noqa: DJ001

    def __str__(self):
        return f"Podcast Episode {self.id}"

    class Meta:
        ordering = ("id",)


class VideoChannel(TimestampedModel):
    """Data model for video channels"""

    channel_id = models.CharField(max_length=80, primary_key=True)
    title = models.CharField(max_length=256)
    published = models.BooleanField(default=True)

    def __str__(self):
        return f"VideoChannel: {self.title} - {self.channel_id}"


class Video(TimestampedModel):
    """Data model for video resources"""

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="video",
        on_delete=models.CASCADE,
    )
    duration = models.CharField(max_length=11)
    transcript = models.TextField(blank=True, default="")

    def __str__(self):
        return f"Video: {self.id} - {self.learning_resource.readable_id}"


class VideoPlaylist(TimestampedModel):
    """
    Video playlist model, contains videos
    """

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="video_playlist",
        on_delete=models.CASCADE,
    )

    channel = models.ForeignKey(
        VideoChannel, on_delete=models.CASCADE, related_name="playlists"
    )

    def __str__(self):
        return (
            f"Video Playlist: "
            f"{self.learning_resource.title} - {self.learning_resource.readable_id}"
        )


class LearningResourceViewEvent(TimestampedModel):
    """Stores lrd_view events, with an FK to the resource the event is for."""

    learning_resource = models.ForeignKey(
        LearningResource,
        on_delete=models.CASCADE,
        help_text="The learning resource for this event.",
        editable=False,
        related_name="views",
    )
    event_date = models.DateTimeField(
        editable=False,
        help_text="The date of the lrd_view event, as collected by PostHog.",
    )

    def __str__(self):
        """Return a string representation of the event."""

        return (
            f"View of Learning Resource {self.learning_resource}"
            f" ({self.learning_resource.platform} -"
            f" {self.learning_resource.readable_id})"
            f" on {self.event_date}"
        )
