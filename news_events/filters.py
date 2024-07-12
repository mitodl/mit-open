"""API query filters for news & events"""

from django_filters import ChoiceFilter, FilterSet, MultipleChoiceFilter

from news_events.constants import NEWS_EVENTS_SORTBY_OPTIONS, FeedType
from news_events.models import FeedItem, FeedSource


class FeedItemFilter(FilterSet):
    """FeedItem filter"""

    feed_type = MultipleChoiceFilter(
        label="The type of item",
        field_name="source__feed_type",
        choices=(FeedType.as_list()),
    )

    sortby = ChoiceFilter(
        label="Sort By",
        method="filter_sortby",
        choices=(
            [(key, value["title"]) for key, value in NEWS_EVENTS_SORTBY_OPTIONS.items()]
        ),
    )

    def filter_sortby(self, queryset, _, value):
        """Sort the queryset in the order specified by the value"""
        sort_param = NEWS_EVENTS_SORTBY_OPTIONS[value]["sort"]
        return queryset.order_by(sort_param)

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
