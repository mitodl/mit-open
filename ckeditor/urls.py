"""URL configuration for ckeditor"""

from django.urls import include, re_path

from ckeditor.views import CKEditorSettingsView

v0_urls = [
    re_path(r"^ckeditor", CKEditorSettingsView.as_view(), name="ckeditor-settings")
]

app_name = "ckeditor"
urlpatterns = [re_path(r"^api/v0/", include((v0_urls, "v0")))]
