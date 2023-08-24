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
    url = models.URLField(null=True, blank=True)
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
    description = models.CharField(max_length=1024, null=True, blank=True)
    alt = models.CharField(max_length=1024, null=True, blank=True)

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

    first_name = models.CharField(max_length=128, null=True, blank=True)
    last_name = models.CharField(max_length=128, null=True, blank=True)
    full_name = models.CharField(max_length=256, null=True, blank=True, unique=True)

    class Meta:
        ordering = ["last_name"]

    def __str__(self):
        return self.full_name or " ".join((self.first_name, self.last_name))


class LearningResource(TimestampedModel):
    """Core model for all learning resources"""

    readable_id = models.CharField(max_length=128, null=False, blank=False)
    title = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)
    full_description = models.TextField(null=True, blank=True)
    last_modified = models.DateTimeField(null=True, blank=True)
    published = models.BooleanField(default=True, db_index=True)
    languages = ArrayField(models.CharField(max_length=24), null=True, blank=True)
    url = models.URLField(null=True, max_length=2048)
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
    resource_type = models.CharField(max_length=24, db_index=True)
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
    description = models.TextField(null=True, blank=True)
    full_description = models.TextField(null=True, blank=True)
    last_modified = models.DateTimeField(null=True, blank=True)
    published = models.BooleanField(default=True, db_index=True)
    languages = ArrayField(models.CharField(max_length=24), null=True, blank=True)
    url = models.URLField(null=True, max_length=2048)
    image = models.ForeignKey(
        LearningResourceImage, null=True, blank=True, on_delete=models.deletion.SET_NULL
    )
    level = models.CharField(max_length=128, null=True, blank=True)
    slug = models.CharField(max_length=1024, null=True, blank=True)
    availability = models.CharField(max_length=128, null=True, blank=True)
    semester = models.CharField(max_length=20, null=True, blank=True)
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

    def __str__(self):
        return f"LearningResourceRun platform={self.learning_resource.platform} run_id={self.run_id}"

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


class Program(TimestampedModel):
    """
    A program is essentially a list of courses.
    There is nothing specific to programs at this point, but the relationship between
    programs and courses may end up being Program->Courses instead of an LR-LR relationship.
    """

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
    """

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="learning_path",
        on_delete=models.CASCADE,
    )
    author = models.ForeignKey(
        User, related_name="learning_paths", on_delete=models.PROTECT
    )

    def __str__(self):
        return f"Staff List: {self.learning_resource.title}"


class LearningResourceRelationship(TimestampedModel):
    """
    LearningResourceRelationship model tracks the relationships between learning resources,
    for example: course LR's in a program LR, all LR's included in a LearningList LR, etc.
    """

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
    )
