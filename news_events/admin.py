"""Admin for news_events app"""

from django.contrib import admin

from news_events import models


class FeedSourceAdmin(admin.ModelAdmin):
    """FeedSource Admin"""

    model = models.FeedSource
    search_fields = ("url", "title", "feed_type")
    list_filter = ("feed_type",)


class FeedEventDetailInline(admin.TabularInline):
    """FeedEventDetail Admin"""

    model = models.FeedEventDetail
    extra = 0
    show_change_link = False


class FeedNewsDetailInline(admin.TabularInline):
    """FeedEventDetail Admin"""

    model = models.FeedNewsDetail
    extra = 0
    show_change_link = False


class FeedItemAdmin(admin.ModelAdmin):
    """FeedItem Admin"""

    model = models.FeedItem
    search_fields = ("url", "title")
    list_display = ("title", "url", "item_date")
    list_filter = ("source", "source__feed_type")
    inlines = [FeedNewsDetailInline, FeedEventDetailInline]


class FeedTopicAdmin(admin.ModelAdmin):
    """FeedTopic Admin"""

    model = models.FeedTopic
    search_fields = ("name", "code")
    list_display = ("name", "code")


admin.site.register(models.FeedSource, FeedSourceAdmin)
admin.site.register(models.FeedItem, FeedItemAdmin)
admin.site.register(models.FeedTopic, FeedTopicAdmin)
