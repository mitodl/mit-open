"""Models for learning resources and related entities"""

from django.contrib.admin.utils import flatten
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import JSONField

from learning_resources import constants
from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
    PrivacyLevel,
)
from open_discussions.models import TimestampedModel


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

    name = models.CharField(max_length=128, unique=True)

    def __str__(self):
        return self.name


class LearningResourceOfferor(TimestampedModel):
    """Represents who is offering a learning resource"""

    code = models.CharField(max_length=12, primary_key=True)
    name = models.CharField(max_length=256, unique=True)
    professional = models.BooleanField(default=False)

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


class LearningResourceDepartment(TimestampedModel):
    """Department data for a learning resource"""

    department_id = models.CharField(max_length=6, primary_key=True)
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

    prefetches = [
        "topics",
        "offered_by",
        "departments",
        "resource_content_tags",
        "runs",
        "runs__instructors",
        "runs__image",
        "children__child",
        "children__child__runs",
        "children__child__runs__instructors",
        "children__child__course",
        "children__child__program",
        "children__child__learning_path",
        "children__child__departments",
        "children__child__platform",
        "children__child__topics",
        "children__child__image",
        "children__child__offered_by",
        "children__child__resource_content_tags",
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
    platform = models.ForeignKey(
        LearningResourcePlatform,
        null=True,
        blank=True,
        on_delete=models.deletion.SET_NULL,
    )
    departments = models.ManyToManyField(
        LearningResourceDepartment,
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
    resource_content_tags = models.ManyToManyField(LearningResourceContentTag)
    resources = models.ManyToManyField(
        "self", through="LearningResourceRelationship", symmetrical=False, blank=True
    )
    etl_source = models.CharField(max_length=12, default="")

    @property
    def audience(self) -> str | None:
        """Returns the audience for the learning resource"""
        if self.platform:
            return self.platform.audience
        return None

    professional = models.BooleanField(default=False)

    @property
    def prices(self) -> str | None:
        """Returns the prices for the learning resource"""
        if self.resource_type in [
            LearningResourceType.course.name,
            LearningResourceType.program.name,
        ]:
            return list(
                set(flatten([run.prices for run in self.runs.all() if run.prices]))
            )
        else:
            return 0

    @property
    def certification(self) -> bool:
        """Returns the certification for the learning resource"""
        return bool(
            self.professional
            or (
                self.offered_by
                and self.offered_by.name == constants.OfferedBy.mitx.value
                and (
                    any(
                        availability != constants.AvailabilityType.archived.value
                        for availability in self.runs.values_list(
                            "availability", flat=True
                        )
                    )
                )
            )
        )

    @property
    def resource_num(self):
        """Extracts the course/program number from the readable_id"""
        return self.readable_id.split("+")[-1]  # pylint:disable=use-maxsplit-arg

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
        models.CharField(max_length=128), null=False, blank=False, default=[]
    )
    slug = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001
    availability = models.CharField(  # noqa: DJ001
        max_length=128, null=True, blank=True
    )
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
