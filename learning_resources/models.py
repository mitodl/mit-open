"""Models for learning resources and related entities"""
from django.contrib.admin.utils import flatten
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models

from learning_resources import constants
from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
)
from open_discussions.models import TimestampedModel


class LearningResourcePlatform(TimestampedModel):
    """Platforms for all learning resources"""

    platform = models.CharField(max_length=12, primary_key=True)
    url = models.URLField(null=True, blank=True)  # noqa: DJ001
    audience = models.CharField(
        max_length=24,
        choices=(
            (constants.OPEN, constants.OPEN),
            (constants.PROFESSIONAL, constants.PROFESSIONAL),
        ),
    )
    is_edx = models.BooleanField(default=False)
    has_content_files = models.BooleanField(default=False)

    def __str__(self):
        return self.platform


class LearningResourceTopic(TimestampedModel):
    """
    Topics for all learning resources (e.g. "History")
    """

    name = models.CharField(max_length=128, unique=True)

    def __str__(self):
        return self.name


class LearningResourceOfferor(TimestampedModel):
    """Represents who is offering a learning resource"""

    name = models.CharField(max_length=256, unique=True)

    def __str__(self):
        return self.name


class LearningResourceImage(TimestampedModel):
    """Represent image metadata for a learning resource"""

    url = models.TextField(max_length=2048)
    description = models.CharField(  # noqa: DJ001
        max_length=1024, null=True, blank=True
    )  # noqa: DJ001, RUF100
    alt = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001

    def __str__(self):
        return self.url


class LearningResourceDepartment(TimestampedModel):
    """Department data for a learning resource"""

    department_id = models.CharField(max_length=6, unique=True)
    name = models.CharField(max_length=256, null=False, blank=False)

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
        ordering = ["last_name"]

    def __str__(self):
        return self.full_name or f"{self.first_name} {self.last_name}"


class LearningResource(TimestampedModel):
    """Core model for all learning resources"""

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
    platform = models.ForeignKey(
        LearningResourcePlatform,
        null=True,
        blank=True,
        on_delete=models.deletion.RESTRICT,
    )
    department = models.ForeignKey(
        LearningResourceDepartment,
        null=True,
        blank=True,
        on_delete=models.deletion.SET_NULL,
    )
    resource_type = models.CharField(
        max_length=24,
        db_index=True,
        choices=((member.value, member.value) for member in LearningResourceType),
    )
    topics = models.ManyToManyField(LearningResourceTopic)
    offered_by = models.ManyToManyField(LearningResourceOfferor)
    resource_content_tags = models.ManyToManyField(LearningResourceContentTag)
    resources = models.ManyToManyField(
        "self", through="LearningResourceRelationship", symmetrical=False, blank=True
    )

    @property
    def audience(self) -> str | None:
        """Returns the audience for the learning resource"""
        if self.platform:
            return self.platform.audience
        return None

    @property
    def prices(self) -> str | None:
        """Returns the prices for the learning resource"""
        if self.resource_type in [
            LearningResourceType.course.value,
            LearningResourceType.program.value,
        ]:
            return list(
                set(flatten([run.prices for run in self.runs.all() if run.prices]))
            )
        else:
            return 0

    @property
    def certification(self) -> str | None:
        """Returns the certification for the learning resource"""
        if self.platform.audience == constants.PROFESSIONAL or (
            self.platform.platform == "mitx"
            and any(
                availability != constants.AvailabilityType.archived.value
                for availability in self.runs.values_list("availability", flat=True)
            )
        ):
            return constants.CERTIFICATE
        return None

    @property
    def resource_num(self):
        """Extracts the course/program number from the readable_id"""
        return self.readable_id.split("+")[-1]  # pylint:disable=use-maxsplit-arg

    class Meta:
        unique_together = (("platform", "readable_id", "resource_type"),)

    def __str__(self):
        return f"{self.title} - {self.readable_id} - {self.resource_type}"


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
    level = models.CharField(max_length=128, null=True, blank=True)  # noqa: DJ001
    slug = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001
    availability = models.CharField(  # noqa: DJ001
        max_length=128, null=True, blank=True
    )  # noqa: DJ001, RUF100
    semester = models.CharField(max_length=20, null=True, blank=True)  # noqa: DJ001
    year = models.IntegerField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True, db_index=True)
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
    extra_course_numbers = ArrayField(
        models.CharField(max_length=128), null=True, blank=True
    )

    @property
    def runs(self):
        """Get the parent LearningResource runs"""
        return self.learning_resource.runs

    def __str__(self):
        return f"Course: {self.id} -  {self.learning_resource.readable_id}"


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

    def __str__(self):
        return f"Program: {self.id} - {self.learning_resource.readable_id}"


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
        return f"Learning Path: {self.id} - {self.learning_resource.readable_id}"


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
    short_url = models.TextField(null=True, blank=True)  # noqa: DJ001
    file_type = models.CharField(max_length=128, null=True, blank=True)  # noqa: DJ001
    section = models.CharField(max_length=512, null=True, blank=True)  # noqa: DJ001
    section_slug = models.CharField(  # noqa: DJ001
        max_length=512, null=True, blank=True
    )

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
    learning_resource_types = ArrayField(
        models.CharField(max_length=256, null=False, blank=False),
        null=True,
        blank=True,
    )
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
    description = models.TextField(null=True, blank=True)  # noqa: DJ001
    topics = models.ManyToManyField(LearningResourceTopic)
    resources = models.ManyToManyField(
        LearningResource, through="UserListRelationship", symmetrical=False, blank=True
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

    def __str__(self):
        return f"ContentFile: {self.id} - {self.title}"


class VideoChannel(TimestampedModel):
    """Data model for video channels"""

    channel_id = models.CharField(max_length=80)
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
    duration = models.CharField(null=True, blank=True, max_length=11)  # noqa: DJ001
    transcript = models.TextField(blank=True, default="")

    @property
    def audience(self):
        """Returns the audience"""
        return [constants.OPEN]

    @property
    def certification(self):
        """Returns the certification"""
        return []

    def __str__(self):
        return f"Video: {self.id} - {self.learning_resource.readable_id}"


class Playlist(TimestampedModel):
    """
    Video playlist model, contains videos
    """

    playlist_id = models.CharField(max_length=80)
    title = models.CharField(max_length=256)
    channel = models.ForeignKey(
        VideoChannel, on_delete=models.CASCADE, related_name="playlists"
    )

    videos = models.ManyToManyField(
        Video, through="PlaylistVideo", through_fields=("playlist", "video")
    )
    published = models.BooleanField(default=True)

    def __str__(self):
        return f"Playlist: {self.title} - {self.playlist_id}"


class PlaylistVideo(TimestampedModel):
    """Join table for Playlist -> Video"""

    video = models.ForeignKey(
        Video, on_delete=models.CASCADE, related_name="playlist_videos"
    )
    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name="playlist_videos"
    )

    position = models.PositiveIntegerField()

    class Meta:
        unique_together = ("playlist", "video")
