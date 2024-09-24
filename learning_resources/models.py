"""Models for learning resources and related entities"""

import uuid
from abc import abstractmethod
from functools import cached_property
from typing import Optional

from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Count, JSONField, OuterRef, Prefetch, Q
from django.db.models.functions import Lower
from django.utils import timezone

from learning_resources import constants
from learning_resources.constants import (
    Availability,
    CertificationType,
    Format,
    LearningResourceDelivery,
    LearningResourceRelationTypes,
    LearningResourceType,
    Pace,
    PrivacyLevel,
)
from main.models import TimestampedModel, TimestampedModelQuerySet


def default_delivery():
    """Return the default delivery as a list"""
    return [LearningResourceDelivery.online.name]


def default_pace():
    """Return the default pace as a list"""
    return [Pace.self_paced.name]


def default_format():
    """Return the default format as a list"""
    return [Format.asynchronous.name]


class LearningResourcePlatform(TimestampedModel):
    """Platforms for all learning resources"""

    code = models.CharField(max_length=12, primary_key=True)
    name = models.CharField(max_length=256, blank=False, default="")
    url = models.URLField(null=True, blank=True)  # noqa: DJ001
    is_edx = models.BooleanField(default=False)
    has_content_files = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.code}: {self.name}"


class LearningResourceTopicQuerySet(TimestampedModelQuerySet):
    """QuerySet for LearningResourceTopic"""

    def for_serialization(self):
        """Return a queryset for serialization"""
        return self.annotate_channel_url()

    def annotate_channel_url(self):
        """Annotate with the channel url"""
        from channels.models import Channel

        return self.annotate(
            channel_url=(
                Channel.objects.filter(topic_detail__topic=OuterRef("pk"))
                .annotate_channel_url()
                .values_list("channel_url", flat=True)[:1]
            ),
        )


class LearningResourceTopic(TimestampedModel):
    """
    Topics for all learning resources (e.g. "History")
    """

    objects = LearningResourceTopicQuerySet.as_manager()

    topic_uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        help_text=(
            "An immutable ID for the topic, used if the topic needs to"
            " be changed via migration."
        ),
    )
    name = models.CharField(max_length=128)
    parent = models.ForeignKey(
        "LearningResourceTopic",
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )
    icon = models.CharField(
        max_length=128,
        help_text="The icon to display for the topic.",
        blank=True,
        default="",
    )

    def __str__(self):
        """Return the topic name."""
        return self.name

    @cached_property
    def channel_url(self):
        """Return the topic's channel url"""
        topic_detail = self.channel_topic_details.first()

        return topic_detail.channel.channel_url if topic_detail is not None else None

    class Meta:
        """Meta options for LearningResourceTopic"""

        constraints = [models.UniqueConstraint(Lower("name"), name="unique_lower_name")]


class LearningResourceOfferorQuerySet(TimestampedModelQuerySet):
    """QuerySet for LearningResourceOfferor"""

    def for_serialization(self):
        """Return a queryset for serialization"""
        return self.annotate_channel_url()

    def annotate_channel_url(self):
        """Annotate with the channel url"""
        from channels.models import Channel

        return self.annotate(
            channel_url=(
                Channel.objects.filter(unit_detail__unit=OuterRef("pk"))
                .annotate_channel_url()
                .values_list("channel_url", flat=True)[:1]
            ),
        )


class LearningResourceOfferor(TimestampedModel):
    """Represents who is offering a learning resource"""

    objects = LearningResourceOfferorQuerySet.as_manager()

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
    # This field name means "value proposition"
    value_prop = models.TextField(blank=True)

    @cached_property
    def channel_url(self):
        """Return the offeror's channel url"""
        unit_detail = self.channel_unit_details.first()

        return unit_detail.channel.channel_url if unit_detail is not None else None

    def __str__(self):
        return f"{self.code}: {self.name}"


class LearningResourceTopicMapping(TimestampedModel):
    """Stores offeror topic mappings for learning resource topics."""

    topic = models.ForeignKey(
        "LearningResourceTopic",
        on_delete=models.CASCADE,
        related_name="+",
    )
    offeror = models.ForeignKey(
        "LearningResourceOfferor",
        on_delete=models.CASCADE,
        related_name="+",
    )
    topic_name = models.CharField(max_length=128)


class LearningResourceImage(TimestampedModel):
    """Represent image metadata for a learning resource"""

    url = models.TextField(max_length=2048)
    description = models.CharField(  # noqa: DJ001
        max_length=1024, null=True, blank=True
    )
    alt = models.CharField(max_length=1024, null=True, blank=True)  # noqa: DJ001

    def __str__(self):
        return self.url


class LearningResourceSchoolQuerySet(TimestampedModelQuerySet):
    """QuerySet for LearningResourceSchool"""

    def for_serialization(self):
        """Return a queryset for serialization"""
        return self.prefetch_related(
            Prefetch(
                "departments",
                queryset=LearningResourceDepartment.objects.for_serialization(),
            )
        )


class LearningResourceSchool(TimestampedModel):
    """School data for a learning resource"""

    objects = LearningResourceSchoolQuerySet.as_manager()

    name = models.CharField(max_length=256, null=False, blank=False)
    url = models.URLField()

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class LearningResourceDepartmentQuerySet(TimestampedModelQuerySet):
    """QuerySet for LearningResourceDepartment"""

    def for_serialization(self, *, prefetch_school: bool = False):
        """Return a queryset for serialization"""
        qs = self.annotate_channel_url()

        if prefetch_school:
            qs = qs.prefetch_related(
                Prefetch(
                    "school",
                    queryset=LearningResourceSchool.objects.for_serialization(),
                )
            )
        return qs

    def annotate_channel_url(self):
        """Annotate the queryset with channel_url"""
        from channels.models import Channel

        return self.annotate(
            channel_url=(
                Channel.objects.filter(department_detail__department=OuterRef("pk"))
                .annotate_channel_url()
                .values_list("channel_url", flat=True)[:1]
            )
        )


class LearningResourceDepartment(TimestampedModel):
    """Department data for a learning resource"""

    objects = LearningResourceDepartmentQuerySet.as_manager()

    department_id = models.CharField(max_length=6, primary_key=True)
    name = models.CharField(max_length=256, null=False, blank=False)
    school = models.ForeignKey(
        LearningResourceSchool,
        null=True,
        on_delete=models.SET_NULL,
        related_name="departments",
    )

    @cached_property
    def channel_url(self) -> str | None:
        """Get the channel url for the department if it exists"""
        from channels.models import Channel

        channel = Channel.objects.filter(department_detail__department=self).first()
        return channel.channel_url if channel is not None else None

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


class LearningResourceQuerySet(TimestampedModelQuerySet):
    """QuerySet for LearningResource"""

    def for_serialization(self, *, user: User | None = None):
        """Return the list of prefetches"""
        return (
            self.prefetch_related(
                Prefetch(
                    "topics",
                    queryset=LearningResourceTopic.objects.for_serialization(),
                ),
                Prefetch(
                    "offered_by",
                    queryset=LearningResourceOfferor.objects.for_serialization(),
                ),
                Prefetch(
                    "departments",
                    queryset=LearningResourceDepartment.objects.for_serialization().select_related(
                        "school"
                    ),
                ),
                "content_tags",
                Prefetch(
                    "runs",
                    queryset=LearningResourceRun.objects.filter(
                        published=True
                    ).for_serialization(),
                ),
                Prefetch(
                    "parents",
                    queryset=LearningResourceRelationship.objects.filter(
                        relation_type=LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
                    )
                    if user is not None
                    and user.is_authenticated
                    and (
                        user.is_staff
                        or user.is_superuser
                        or user.groups.filter(
                            name=constants.GROUP_STAFF_LISTS_EDITORS
                        ).exists()
                    )
                    else LearningResourceRelationship.objects.none(),
                    to_attr="_learning_path_parents",
                ),
                Prefetch(
                    "user_lists",
                    queryset=UserListRelationship.objects.filter(parent__author=user)
                    if user is not None and user.is_authenticated
                    else UserListRelationship.objects.none(),
                    to_attr="_user_list_parents",
                ),
                *LearningResourceDetailModel.get_subclass_prefetches(),
            )
            .select_related("image", "platform")
            .annotate(views_count=Count("views"))
        )

    def for_search_serialization(self):
        return self.annotate(in_featured_lists=Count("parents__parent__channel"))


class LearningResource(TimestampedModel):
    """Core model for all learning resources"""

    objects = LearningResourceQuerySet.as_manager()

    readable_id = models.CharField(max_length=512, null=False, blank=False)
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
    prices = ArrayField(
        models.DecimalField(decimal_places=2, max_digits=12), default=list
    )
    availability = models.CharField(  # noqa: DJ001
        max_length=24,
        null=True,
        choices=((member.name, member.value) for member in Availability),
    )
    completeness = models.FloatField(default=1.0)
    delivery = ArrayField(
        models.CharField(
            max_length=24, db_index=True, choices=LearningResourceDelivery.as_tuple()
        ),
        default=default_delivery,
    )
    license_cc = models.BooleanField(default=False)
    continuing_ed_credits = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    pace = ArrayField(
        models.CharField(
            max_length=24,
            choices=Pace.as_tuple(),
        ),
        default=default_pace,
    )
    format = ArrayField(
        models.CharField(
            max_length=24,
            choices=Format.as_tuple(),
        ),
        default=default_format,
    )

    @property
    def audience(self) -> str | None:
        """Returns the audience for the learning resource"""
        if self.platform:
            return self.platform.audience
        return None

    @cached_property
    def next_run(self) -> Optional["LearningResourceRun"]:
        """Returns the next run for the learning resource"""
        return (
            self.runs.filter(Q(published=True) & Q(start_date__gt=timezone.now()))
            .order_by("start_date")
            .first()
        )

    @cached_property
    def views_count(self) -> int:
        """Return the number of views for the resource."""
        return models.LearningResourceViewEvent.objects.filter(
            learning_resource=self
        ).count()

    @cached_property
    def user_list_parents(self) -> list["LearningResourceRelationship"]:
        """Return a list of user lists that the resource is in"""
        return getattr(self, "_user_list_parents", [])

    @cached_property
    def learning_path_parents(self) -> list["LearningResourceRelationship"]:
        """Return a list of learning paths that the resource is in"""
        return getattr(
            self,
            "_learning_path_parents",
            self.parents.filter(
                relation_type=LearningResourceRelationTypes.LEARNING_PATH_ITEMS
            ),
        )

    class Meta:
        unique_together = (("platform", "readable_id", "resource_type"),)


class LearningResourceDetailQuerySet(TimestampedModelQuerySet):
    """Base QuerySet for Learning resource detail models"""

    @abstractmethod
    def for_serialization(self):
        """Return a QuerySet for serialization"""
        return self


class LearningResourceDetailModel(TimestampedModel):
    """Base class for learning resource detail models"""

    objects = LearningResourceDetailQuerySet.as_manager()

    @classmethod
    def get_subclass_prefetches(cls) -> list[Prefetch]:
        """
        Return the list of prefetches for all subclasses
        """
        return [
            Prefetch(
                subclass.get_learning_resource_related_name(),
                queryset=subclass.objects.for_serialization(),
            )
            for subclass in cls.__subclasses__()
        ]

    @classmethod
    def get_learning_resource_related_name(cls) -> str:
        """Return the related name for the learning_resource field"""
        return cls._meta.get_field("learning_resource").remote_field.get_accessor_name()

    class Meta:
        abstract = True


class LearningResourceRunQuerySet(TimestampedModelQuerySet):
    """QuerySet for LearningResourceRun"""

    def for_serialization(self):
        """QuerySet for serialization"""
        return self.select_related("image").prefetch_related("instructors")


class LearningResourceRun(TimestampedModel):
    """
    Model for course and program runs
    """

    objects = LearningResourceRunQuerySet.as_manager()

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
    delivery = ArrayField(
        models.CharField(
            max_length=24, db_index=True, choices=LearningResourceDelivery.as_tuple()
        ),
        default=default_delivery,
    )
    availability = models.CharField(  # noqa: DJ001
        max_length=24,
        null=True,
        choices=Availability.as_tuple(),
    )
    pace = ArrayField(
        models.CharField(
            max_length=24,
            choices=Pace.as_tuple(),
        ),
        default=default_pace,
    )
    format = ArrayField(
        models.CharField(
            max_length=24,
            choices=Format.as_tuple(),
        ),
        default=default_format,
    )

    def __str__(self):
        return f"LearningResourceRun platform={self.learning_resource.platform} run_id={self.run_id}"  # noqa: E501

    class Meta:
        unique_together = (("learning_resource", "run_id"),)


class CourseQuerySet(LearningResourceDetailQuerySet):
    """QuerySet for Course"""

    def for_serialization(self):
        """Prefetch for serialization"""
        return self


class Course(LearningResourceDetailModel):
    """Model for representing a course"""

    objects = CourseQuerySet.as_manager()

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


class ProgramQuerySet(LearningResourceDetailQuerySet):
    """QuerySet for Program"""

    def for_serialization(self):
        """Prefetch for serialization"""
        return (
            super()
            .for_serialization()
            .annotate(
                course_count=Count(
                    "learning_resource__children",
                    filter=Q(
                        learning_resource__children__relation_type=LearningResourceRelationTypes.PROGRAM_COURSES.value,
                        learning_resource__children__child__published=True,
                    ),
                )
            )
        )


class Program(LearningResourceDetailModel):
    """
    A program is essentially a list of courses.
    There is nothing specific to programs at this point, but the relationship between
    programs and courses may end up being Program->Courses instead of an LR-LR relationship.
    """  # noqa: E501

    objects = ProgramQuerySet.as_manager()

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

    @cached_property
    def course_count(self):
        """Return the number of courses in the program"""
        return self.learning_resource.children.filter(
            relation_type=LearningResourceRelationTypes.PROGRAM_COURSES,
            child__published=True,
        ).count()


class LearningPathQuerySet(LearningResourceDetailQuerySet):
    """QuerySet for LearningPath"""

    def for_serialization(self):
        """Prefetch for serialization"""
        return self


class LearningPath(LearningResourceDetailModel):
    """
    Model for representing a publishable list of  learning resources
    The LearningResource readable_id should probably be something like an auto-generated UUID.
    """  # noqa: E501

    objects = LearningPathQuerySet.as_manager()

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

    class Meta:
        ordering = ["position"]


class ContentFileQuerySet(TimestampedModelQuerySet):
    """QuerySet for ContentFile"""

    def for_serialization(self):
        """Return a queryset ready for serialization"""
        return self.select_related("run").prefetch_related(
            "content_tags",
            "run__learning_resource",
            Prefetch(
                "run__learning_resource__topics",
                queryset=LearningResourceTopic.objects.for_serialization(),
            ),
            Prefetch(
                "run__learning_resource__departments",
                queryset=LearningResourceDepartment.objects.for_serialization(),
            ),
        )


class ContentFile(TimestampedModel):
    """
    ContentFile model for LearningResourceRun files
    """

    objects = ContentFileQuerySet.as_manager()

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

    class Meta:
        ordering = ["position"]


class PodcastQuerySet(LearningResourceDetailQuerySet):
    """QuerySet for Podcast"""

    def for_serialization(self):
        """Prefetch for serialization"""
        return self.annotate(
            episode_count=Count(
                "learning_resource__children",
                filter=Q(
                    learning_resource__children__relation_type=LearningResourceRelationTypes.PODCAST_EPISODES.value,
                    learning_resource__children__child__published=True,
                ),
            )
        )


class Podcast(LearningResourceDetailModel):
    """Data model for podcasts"""

    objects = PodcastQuerySet.as_manager()

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="podcast",
        on_delete=models.CASCADE,
    )
    apple_podcasts_url = models.URLField(null=True, max_length=2048)  # noqa: DJ001
    google_podcasts_url = models.URLField(null=True, max_length=2048)  # noqa: DJ001
    rss_url = models.URLField(null=True, max_length=2048)  # noqa: DJ001

    @cached_property
    def episode_count(self) -> int:
        """Return the number of episodes in the podcast"""
        return self.learning_resource.children.filter(
            relation_type=constants.LearningResourceRelationTypes.PODCAST_EPISODES.value
        ).count()

    def __str__(self):
        return f"Podcast {self.id}"

    class Meta:
        ordering = ("id",)


class PodcastEpisodeQuerySet(LearningResourceDetailQuerySet):
    """QuerySet for PodcastEpisode"""

    def for_serialization(self):
        """Prefetch for serialization"""
        return self


class PodcastEpisode(LearningResourceDetailModel):
    """Data model for podcast episodes"""

    objects = PodcastEpisodeQuerySet.as_manager()

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


class VideoQuerySet(LearningResourceDetailQuerySet):
    """QuerySet for Video"""

    def for_serialization(self):
        """Return queryset for serialization"""
        return self


class Video(LearningResourceDetailModel):
    """Data model for video resources"""

    objects = VideoQuerySet.as_manager()

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="video",
        on_delete=models.CASCADE,
    )
    duration = models.CharField(max_length=11)
    transcript = models.TextField(blank=True, default="")

    def __str__(self):
        return f"Video: {self.id} - {self.learning_resource.readable_id}"


class VideoPlaylistQuerySet(LearningResourceDetailQuerySet):
    """QuerySet for VideoPlaylist"""

    def for_serialization(self):
        """Return queryset for serialization"""
        return self.annotate(
            video_count=Count(
                "learning_resource__children",
                filter=Q(
                    learning_resource__children__relation_type=LearningResourceRelationTypes.PLAYLIST_VIDEOS.value,
                    learning_resource__children__child__published=True,
                ),
            )
        ).prefetch_related("channel")


class VideoPlaylist(LearningResourceDetailModel):
    """
    Video playlist model, contains videos
    """

    objects = VideoPlaylistQuerySet.as_manager()

    learning_resource = models.OneToOneField(
        LearningResource,
        related_name="video_playlist",
        on_delete=models.CASCADE,
    )

    channel = models.ForeignKey(
        VideoChannel, on_delete=models.CASCADE, related_name="playlists"
    )

    @cached_property
    def video_count(self) -> int:
        """Return the number of videos in the playlist"""
        return self.learning_resource.children.filter(
            relation_type=constants.LearningResourceRelationTypes.PLAYLIST_VIDEOS.value
        ).count()

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
