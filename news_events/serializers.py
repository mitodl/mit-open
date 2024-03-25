"""Serializers for news_events"""

from rest_framework import serializers

from news_events import models
from news_events.constants import FeedType

COMMON_IGNORED_FIELDS = ("created_on", "updated_on")


class FeedImageSerializer(serializers.ModelSerializer):
    """Serializer for FeedImage"""

    class Meta:
        model = models.FeedImage
        exclude = COMMON_IGNORED_FIELDS


class FeedSourceSerializer(serializers.ModelSerializer):
    """FeedSource serializer"""

    image = FeedImageSerializer()

    class Meta:
        model = models.FeedSource
        exclude = COMMON_IGNORED_FIELDS


class FeedEventDetailSerializer(serializers.ModelSerializer):
    """FeedEventDetail serializer"""

    class Meta:
        model = models.FeedEventDetail
        exclude = ("feed_item", *COMMON_IGNORED_FIELDS)


class FeedNewsDetailSerializer(serializers.ModelSerializer):
    """FeedNewsDetail serializer"""

    class Meta:
        model = models.FeedNewsDetail
        exclude = ("feed_item", *COMMON_IGNORED_FIELDS)


class FeedItemBaseSerializer(serializers.ModelSerializer):
    """Base serializer for FeedItem"""

    feed_type = serializers.CharField(source="source.feed_type")
    image = FeedImageSerializer()

    class Meta:
        model = models.FeedItem
        exclude = COMMON_IGNORED_FIELDS


class FeedItemTypeField(serializers.ReadOnlyField):
    """Field for FeedItem.feed_type"""


class NewsFeedItemSerializer(FeedItemBaseSerializer):
    """Serializer for News FeedItem"""

    feed_type = FeedItemTypeField(default=FeedType.news.name)
    news_details = FeedNewsDetailSerializer()


class EventFeedItemSerializer(FeedItemBaseSerializer):
    """Serializer for News FeedItem"""

    feed_type = FeedItemTypeField(default=FeedType.events.name)
    event_details = FeedEventDetailSerializer()


class FeedItemSerializer(serializers.Serializer):
    """Serializer for FeedItem"""

    serializer_cls_mapping = {
        serializer_cls().fields["feed_type"].default: serializer_cls
        for serializer_cls in (
            EventFeedItemSerializer,
            NewsFeedItemSerializer,
        )
    }

    def to_representation(self, instance):
        """Serialize a FeedItem based on feed_type"""
        serializer_cls = self.serializer_cls_mapping[instance.source.feed_type]

        return serializer_cls(instance=instance, context=self.context).data
