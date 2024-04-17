"""admin for learning_resources"""

from django.contrib import admin
from django.contrib.admin import TabularInline

from learning_resources import models


class LearningResourceInstructorAdmin(admin.ModelAdmin):
    """Instructor Admin"""

    model = models.LearningResourceInstructor
    search_fields = ("full_name", "first_name", "last_name")


class LearningResourceTopicAdmin(admin.ModelAdmin):
    """Topic Admin"""

    model = models.LearningResourceTopic
    search_fields = ("name",)


class LearningResourceDepartmentAdmin(admin.ModelAdmin):
    """Department Admin"""

    model = models.LearningResourceDepartment
    list_display = ("name", "department_id")
    search_fields = ("name", "department_id")


class LearningResourcePlatformAdmin(admin.ModelAdmin):
    """Platform Admin"""

    model = models.LearningResourcePlatform
    search_fields = ("platform",)


class LearningResourceOfferorAdmin(admin.ModelAdmin):
    """Offeror Admin"""

    model = models.LearningResourceOfferor
    search_fields = ("name",)


class LearningResourceRunAdmin(admin.ModelAdmin):
    """LearningResourceRun Admin"""

    model = models.LearningResourceRun

    search_fields = ("run_id", "title", "learning_resource__readable_id")
    list_display = ("run_id", "title", "start_date", "enrollment_start")
    list_filter = (
        "semester",
        "year",
        "learning_resource__platform",
        "learning_resource__offered_by",
        "learning_resource__etl_source",
        "learning_resource__resource_type",
    )
    autocomplete_fields = ("instructors", "learning_resource")


class LearningResourceRunInline(TabularInline):
    """Inline list items for course/program runs"""

    model = models.LearningResourceRun
    extra = 0
    show_change_link = True
    fields = (
        "run_id",
        "enrollment_start",
        "start_date",
        "semester",
        "year",
        "published",
    )


class LearningResourceViewEvent(admin.ModelAdmin):
    """LearningResourceViewEvent admin"""

    model = models.LearningResourceViewEvent


class CourseInline(TabularInline):
    """Inline list items for Courses"""

    model = models.Course
    extra = 0
    show_change_link = True


class LearningPathInline(TabularInline):
    """Inline list items for LearningPaths"""

    model = models.LearningPath
    extra = 0
    show_change_link = True


class VideoInline(TabularInline):
    """Inline Video objects"""

    model = models.Video
    show_change_link = True


class VideoPlaylistInline(TabularInline):
    """Inline VideoPlaylist objects"""

    model = models.VideoPlaylist
    extra = 0
    show_change_link = True
    fields = ("channel",)


class ProgramInline(TabularInline):
    """Inline Program objects"""

    model = models.Program
    show_change_link = True


class PodcastInline(TabularInline):
    """Inline Podcast objects"""

    model = models.Podcast
    show_change_link = True


class PodcastEpisodeInline(TabularInline):
    """Inline podcast episode objects"""

    model = models.PodcastEpisode
    show_change_link = True


class LearningResourceAdmin(admin.ModelAdmin):
    """LearningResource Admin"""

    model = models.LearningResource
    search_fields = ("readable_id", "title")
    list_display = (
        "readable_id",
        "title",
        "platform",
        "etl_source",
        "offered_by",
        "resource_type",
        "published",
    )
    list_filter = ("platform", "offered_by", "etl_source", "resource_type", "published")
    inlines = [
        CourseInline,
        LearningResourceRunInline,
        LearningPathInline,
        ProgramInline,
        PodcastInline,
        PodcastEpisodeInline,
        VideoInline,
        VideoPlaylistInline,
    ]
    autocomplete_fields = ("topics",)


class UserListAdmin(admin.ModelAdmin):
    """UserList Admin"""

    model = models.UserList
    search_fields = ("title", "author__username", "author__email")
    list_display = ("title", "author", "created_on", "updated_on")


class VideoChannelAdmin(admin.ModelAdmin):
    """VideoChannel Admin"""

    model = models.VideoChannel
    list_display = ("title", "channel_id", "published")
    search_fields = ("title", "channel_id")
    list_filter = ("published",)
    inlines = (VideoPlaylistInline,)


admin.site.register(models.LearningResourceTopic, LearningResourceTopicAdmin)
admin.site.register(models.LearningResourceInstructor, LearningResourceInstructorAdmin)
admin.site.register(models.LearningResource, LearningResourceAdmin)
admin.site.register(models.LearningResourceRun, LearningResourceRunAdmin)
admin.site.register(models.LearningResourceDepartment, LearningResourceDepartmentAdmin)
admin.site.register(models.LearningResourcePlatform, LearningResourcePlatformAdmin)
admin.site.register(models.LearningResourceOfferor, LearningResourceOfferorAdmin)
admin.site.register(models.UserList, UserListAdmin)
admin.site.register(models.VideoChannel, VideoChannelAdmin)
