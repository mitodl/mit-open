"""URLs for search"""
from django.urls import re_path

from learning_resources_search.views import SearchView

urlpatterns = [
    re_path(r"api/v1/search/", SearchView.as_view(), name="search"),
]
