"""Serializers for learning_resources"""
import logging

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F, Max
from rest_framework import serializers

from learning_resources import models
from learning_resources.serializers.constants import COMMON_IGNORED_FIELDS
from learning_resources.serializers.fields import LearningResourceImageSerializer
from learning_resources.serializers.learning_resources import (
    LearningResourceSerializer,
)
from learning_resources.serializers.mixins import WriteableTopicsMixin

log = logging.getLogger(__name__)


class UserListSerializer(serializers.ModelSerializer, WriteableTopicsMixin):
    """
    Simplified serializer for UserList model.
    """

    item_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    def get_image(self, instance) -> dict:
        """Return the image of the first item"""
        list_item = instance.children.order_by("position").first()
        if list_item and list_item.child.image:
            return LearningResourceImageSerializer(instance=list_item.child.image).data
        return None

    def get_item_count(self, instance) -> int:
        """Return the number of items in the list"""
        return getattr(instance, "item_count", None) or instance.resources.count()

    def create(self, validated_data):
        """Create a new user list"""
        request = self.context.get("request")
        if request and hasattr(request, "user") and isinstance(request.user, User):
            validated_data["author"] = request.user
            topics_data = validated_data.pop("topics", [])
            with transaction.atomic():
                userlist = super().create(validated_data)
                userlist.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            return userlist
        return None

    def update(self, instance, validated_data):
        """Update an existing user list"""
        request = self.context.get("request")
        validated_data["author"] = request.user
        topics_data = validated_data.pop("topics", None)
        with transaction.atomic():
            userlist = super().update(instance, validated_data)
            if topics_data is not None:
                userlist.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            return userlist

    class Meta:
        model = models.UserList
        exclude = ("resources", *COMMON_IGNORED_FIELDS)
        read_only_fields = ["author"]


class UserListRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer for UserListRelationship model
    """

    resource = LearningResourceSerializer(read_only=True, source="child")

    def create(self, validated_data):
        user_list = validated_data["parent"]
        items = models.UserListRelationship.objects.filter(parent=user_list)
        position = (
            items.aggregate(Max("position"))["position__max"] or items.count()
        ) + 1
        item, _ = models.UserListRelationship.objects.get_or_create(
            parent=validated_data["parent"],
            child=validated_data["child"],
            defaults={"position": position},
        )
        return item

    def update(self, instance, validated_data):
        position = validated_data["position"]
        with transaction.atomic():
            if position > instance.position:
                # move items between old & new positions up, inclusive of new position
                models.UserListRelationship.objects.filter(
                    position__lte=position, position__gt=instance.position
                ).update(position=F("position") - 1)
            else:
                models.UserListRelationship.objects.filter(
                    position__lt=instance.position, position__gte=position
                ).update(position=F("position") + 1)
            instance.position = position
            instance.save()

        return instance

    class Meta:
        model = models.UserListRelationship
        extra_kwargs = {"position": {"required": False}}
        exclude = COMMON_IGNORED_FIELDS
