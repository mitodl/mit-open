"""
Admin site bindings for profiles
"""

from django.contrib import admin

from profiles.forms import ProfileForm
from profiles.models import Profile


class ProfileAdmin(admin.ModelAdmin):
    """Admin for Profile"""

    model = Profile
    form = ProfileForm

    list_display = ["user", "name", "email_optin", "toc_optin"]
    list_filter = ["email_optin", "toc_optin", "user__is_active"]

    search_fields = ["name", "user__email", "user__username"]
    raw_id_fields = ("user",)
    readonly_fields = (
        "image",
        "image_small",
        "image_medium",
        "image_file",
        "image_small_file",
        "image_medium_file",
        "updated_at"
    )


admin.site.register(Profile, ProfileAdmin)
