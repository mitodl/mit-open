"""project URL Configuration
"""

from django.urls import include, re_path

urlpatterns = [
    re_path(r"", include("learning_resources.urls")),
    re_path(r"", include("articles.urls")),
    re_path(r"", include("learning_resources_search.urls")),
    re_path(r"", include("channels.urls")),
]
