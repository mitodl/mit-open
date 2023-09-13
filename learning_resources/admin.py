"""admin for course catalog"""

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
    )


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
    """PodcastAdmin"""

    model = models.Video
    show_change_link = True


class ProgramInline(TabularInline):
    """PodcastAdmin"""

    model = models.Program
    show_change_link = True


class LearningResourceAdmin(admin.ModelAdmin):
    """LearningResource Admin"""

    model = models.LearningResource
    search_fields = ("readable_id", "title")
    list_display = ("readable_id", "title", "platform", "resource_type", "published")
    list_filter = ("platform", "resource_type", "published", "offered_by", "department")
    inlines = [CourseInline, ProgramInline, VideoInline, LearningPathInline]
    autocomplete_fields = ("topics",)


class PlaylistInline(TabularInline):
    """Inline list items for Playlists"""

    model = models.Playlist
    extra = 0
    show_change_link = True


class PlaylistVideoInline(TabularInline):
    """Inline list items for PlaylistVideos"""

    model = models.PlaylistVideo
    extra = 0
    show_change_link = True


class VideoChannelAdmin(admin.ModelAdmin):
    model = models.VideoChannel
    list_display = ("title", "channel_id", "published")
    search_fields = ("title", "channel_id")
    list_filter = ("published",)
    inlines = (PlaylistInline,)


class PlaylistAdmin(admin.ModelAdmin):
    model = models.Playlist
    list_display = ("title", "playlist_id", "published")
    search_fields = ("title", "playlist_id")
    inlines = (PlaylistVideoInline,)


admin.site.register(models.LearningResourceTopic, LearningResourceTopicAdmin)
admin.site.register(models.LearningResourceInstructor, LearningResourceInstructorAdmin)
admin.site.register(models.LearningResource, LearningResourceAdmin)
admin.site.register(models.LearningResourceRun, LearningResourceRunAdmin)
admin.site.register(models.LearningResourceDepartment, LearningResourceDepartmentAdmin)
admin.site.register(models.LearningResourcePlatform, LearningResourcePlatformAdmin)
admin.site.register(models.LearningResourceOfferor, LearningResourceOfferorAdmin)
admin.site.register(models.VideoChannel, VideoChannelAdmin)
admin.site.register(models.Playlist, PlaylistAdmin)
