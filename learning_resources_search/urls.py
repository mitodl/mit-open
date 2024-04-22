"""URLs for search"""

from django.urls import include, path, re_path

from learning_resources_search.views import (
    ContentFileSearchView,
    LearningResourcesSearchView,
)

v1_urls = [
    path(
        r"learning_resources_search/",
        LearningResourcesSearchView.as_view(),
        name="learning_resources_search",
    ),
    re_path(
        r"content_file_search/",
        ContentFileSearchView.as_view(),
        name="content_file_search",
    ),
]

app_name = "lr_search"
urlpatterns = [
    re_path(r"^api/v1/", include((v1_urls, "v1"))),
]
