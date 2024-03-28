"""API query filters for news & events"""

from django_filters import FilterSet, MultipleChoiceFilter

from news_events.constants import FeedType
from news_events.models import FeedItem, FeedSource


class FeedItemFilter(FilterSet):
    """FeedItem filter"""

    feed_type = MultipleChoiceFilter(
        label="The type of item",
        field_name="source__feed_type",
        choices=(FeedType.as_list()),
    )

    class Meta:
        model = FeedItem
        fields = []


class FeedSourceFilter(FilterSet):
    """FeedSource filter"""

    feed_type = MultipleChoiceFilter(
        label="The type of source",
        field_name="feed_type",
        choices=(FeedType.as_list()),
    )

    class Meta:
        model = FeedSource
        fields = []
