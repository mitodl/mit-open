"""Admin for news_events app"""

from django.contrib import admin

from news_events import models


class FeedImageAdmin(admin.ModelAdmin):
    """FeedImage Admin"""

    model = models.FeedImage
    search_fields = ("url", "description", "alt")
    list_display = ("url", "description", "alt")


class FeedSourceAdmin(admin.ModelAdmin):
    """FeedSource Admin"""

    model = models.FeedSource
    search_fields = ("url", "title", "feed_type")
    list_filter = ("feed_type",)


class FeedItemAdmin(admin.ModelAdmin):
    """FeedItem Admin"""

    model = models.FeedItem
    search_fields = ("url", "title")
    list_display = ("title", "url", "item_date")
    list_filter = ("source", "source__feed_type")


class FeedNewsDetailAdmin(admin.ModelAdmin):
    """FeedNewsDetail Admin"""

    model = models.FeedNewsDetail
    list_display = ("feed_item_id", "authors")


class FeedEventDetailAdmin(admin.ModelAdmin):
    """FeedEventDetail Admin"""

    model = models.FeedEventDetail
    list_display = ("feed_item_id", "location", "audience", "event_type")


class FeedTopicAdmin(admin.ModelAdmin):
    """FeedTopic Admin"""

    model = models.FeedTopic
    search_fields = ("name", "code")
    list_display = ("name", "code")


admin.site.register(models.FeedSource, FeedSourceAdmin)
admin.site.register(models.FeedItem, FeedItemAdmin)
admin.site.register(models.FeedTopic, FeedTopicAdmin)
admin.site.register(models.FeedImage, FeedImageAdmin)
admin.site.register(models.FeedNewsDetail, FeedNewsDetailAdmin)
admin.site.register(models.FeedEventDetail, FeedEventDetailAdmin)
