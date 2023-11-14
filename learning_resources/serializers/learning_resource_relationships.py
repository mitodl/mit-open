"""Serializers for LearningResourceRelationships"""
import logging

from django.db import transaction
from django.db.models import F, Max
from rest_framework import serializers

from learning_resources import constants, models
from learning_resources.serializers.base import BaseSerializer
from learning_resources.serializers.learning_resources import (
    LearningResourceSerializer,
)

log = logging.getLogger(__name__)


class LearningResourceChildSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceRelationship children"""

    def to_representation(self, instance):
        """Serialize a LearningResourceRelationship by inlining the resource itself"""
        return LearningResourceSerializer(instance=instance.child).data

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("child",)


class LearningResourceRelationshipSerializer(BaseSerializer):
    """CRUD serializer for LearningResourceRelationship"""

    resource = LearningResourceSerializer(read_only=True, source="child")

    def create(self, validated_data):
        resource = validated_data["parent"]
        items = models.LearningResourceRelationship.objects.filter(parent=resource)
        position = (
            items.aggregate(Max("position"))["position__max"] or items.count()
        ) + 1
        item, _ = models.LearningResourceRelationship.objects.get_or_create(
            parent=validated_data["parent"],
            child=validated_data["child"],
            relation_type=validated_data["relation_type"],
            defaults={"position": position},
        )
        return item

    def update(self, instance, validated_data):
        position = validated_data["position"]
        # to perform an update on position we atomically:
        # 1) move everything between the old position and the new position towards the old position by 1  # noqa: E501
        # 2) move the item into its new position
        # this operation gets slower the further the item is moved, but it is sufficient for now  # noqa: E501
        with transaction.atomic():
            path_items = models.LearningResourceRelationship.objects.filter(
                parent=instance.parent,
                relation_type=instance.relation_type,
            )
            if position > instance.position:
                # move items between the old and new positions up, inclusive of the new position  # noqa: E501
                path_items.filter(
                    position__lte=position, position__gt=instance.position
                ).update(position=F("position") - 1)
            else:
                # move items between the old and new positions down, inclusive of the new position  # noqa: E501
                path_items.filter(
                    position__lt=instance.position, position__gte=position
                ).update(position=F("position") + 1)
            # now move the item into place
            instance.position = position
            instance.save()

        return instance

    class Meta(BaseSerializer.Meta):
        model = models.LearningResourceRelationship
        extra_kwargs = {"position": {"required": False}}


class LearningPathRelationshipSerializer(LearningResourceRelationshipSerializer):
    """Specialized serializer for a LearningPath relationship"""

    relation_type = serializers.HiddenField(
        default=constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
    )
