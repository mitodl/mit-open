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


class LearningResourceAdmin(admin.ModelAdmin):
    """LearningResource Admin"""

    model = models.LearningResource
    search_fields = ("readable_id", "title")
    list_display = (
        "readable_id",
        "title",
        "platform",
        "offered_by",
        "resource_type",
        "published",
    )
    list_filter = ("platform", "offered_by", "resource_type", "published")
    inlines = [CourseInline, LearningPathInline, LearningResourceRunInline]
    autocomplete_fields = ("topics",)


admin.site.register(models.LearningResourceTopic, LearningResourceTopicAdmin)
admin.site.register(models.LearningResourceInstructor, LearningResourceInstructorAdmin)
admin.site.register(models.LearningResource, LearningResourceAdmin)
admin.site.register(models.LearningResourceRun, LearningResourceRunAdmin)
admin.site.register(models.LearningResourceDepartment, LearningResourceDepartmentAdmin)
admin.site.register(models.LearningResourcePlatform, LearningResourcePlatformAdmin)
admin.site.register(models.LearningResourceOfferor, LearningResourceOfferorAdmin)
