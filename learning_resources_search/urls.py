"""URLs for search"""

from django.urls import re_path

from learning_resources_search.views import (
    ContentFileSearchView,
    LearningResourcesSearchView,
)

urlpatterns = [
    re_path(
        r"api/v1/learning_resources_search/",
        LearningResourcesSearchView.as_view(),
        name="learning_resources_search",
    ),
    re_path(
        r"api/v1/content_file_search/",
        ContentFileSearchView.as_view(),
        name="content_file_search",
    ),
]
