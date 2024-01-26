"""URL configuration for ckeditor"""

from django.urls import include, re_path

from ckeditor.views import ckeditor_view

v0_urls = [re_path(r"ckeditor/", ckeditor_view, name="ckeditor-token")]

app_name = "ckeditor"
urlpatterns = [re_path(r"^api/v0/", include((v0_urls, "v0")))]
