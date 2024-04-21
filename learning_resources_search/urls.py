"""URLs for search"""

from django.urls import include, re_path
from rest_framework.routers import SimpleRouter

from learning_resources_search.views import (
    ContentFileSearchView,
    LearningResourcesSearchView,
    UserSearchSubscriptionViewSet,
)

router = SimpleRouter()
router.register(
    r"learning_resources_user_subscribe",
    UserSearchSubscriptionViewSet,
    basename="learning_resources_user_subscribe",
)

v1_urls = [
    *router.urls,
    re_path(
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
