"""Models for learning_resourcses_search"""
from django.db import models

from open_discussions.models import TimestampedModel


class ModelGroup(TimestampedModel):
    """A group of models"""

    name = models.CharField(max_length=256, unique=True)
    group_id = models.CharField(max_length=256)
    description = models.TextField()
    default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.group_id}: {self.name}"


class SemanticModel(TimestampedModel):
    """A semantic ML model"""

    name = models.CharField(max_length=256, unique=True)
    model_id = models.CharField(max_length=256)
    version = models.TextField()
    group = models.ForeignKey(ModelGroup, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.model_id}: {self.name}"
