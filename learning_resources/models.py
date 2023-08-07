"""Models for learning resources and related entities"""
from django.contrib.postgres.fields import ArrayField
from django.db import models

from open_discussions.models import TimestampedModel


class LearningResourcePlatform(TimestampedModel):
    """Platforms for all learning resources"""

    platform = models.CharField(max_length=12, primary_key=True)
    url = models.URLField(null=True, blank=True)

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

    url = models.TextField(max_length=2048, null=True, blank=True)
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


class LearningResourcePrice(TimestampedModel):
    """
    Price model for all learning resources (e.g. "price": 0.00, "mode": "audit")
    """

    price = models.DecimalField(decimal_places=2, max_digits=12)
    mode = models.CharField(max_length=128)
    upgrade_deadline = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return "${:,.2f}".format(self.price)


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

    object_id = models.CharField(max_length=128, null=False, blank=False)
    title = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)
    full_description = models.TextField(null=True, blank=True)
    last_modified = models.DateTimeField(null=True, blank=True)
    published = models.BooleanField(default=True, db_index=True)
    language = ArrayField(models.CharField(max_length=24, null=True, blank=True))
    url = models.URLField(null=True, max_length=2048)

    platform = models.ForeignKey(
        LearningResourcePlatform,
        null=True,
        blank=True,
        on_delete=models.deletion.RESTRICT,
    )
    image = models.ForeignKey(
        LearningResourceImage, null=True, blank=True, on_delete=models.deletion.SET_NULL
    )
    department = models.ForeignKey(
        LearningResourceDepartment,
        null=True,
        blank=True,
        on_delete=models.deletion.SET_NULL,
    )

    topics = models.ManyToManyField(LearningResourceTopic)
    offered_by = models.ManyToManyField(LearningResourceOfferor)
    instructors = models.ManyToManyField(LearningResourceInstructor)
    prices = models.ManyToManyField(LearningResourcePrice)
    resource_content_tags: models.ManyToManyField(LearningResourceContentTag)

    class Meta:
        unique_together = (("platform", "object_id"),)
