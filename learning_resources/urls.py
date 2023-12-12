"""Urls for channels"""

from django.urls import include, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_extensions.routers import ExtendedSimpleRouter

from learning_resources import views
from learning_resources.views import WebhookOCWNextView

router = ExtendedSimpleRouter()
resource_router = router.register(
    r"learning_resources",
    views.LearningResourceViewSet,
    basename="learning_resources_api",
)
resource_router.register(
    r"contentfiles",
    views.LearningResourceContentFilesViewSet,
    basename="lr_learning_resource_content_files_api",
    parents_query_lookups=["run__learning_resource"],
)
resource_router.register(
    r"items",
    views.ResourceListItemsViewSet,
    basename="lr_learning_resource_items_api",
    parents_query_lookups=["parent_id"],
)
router.register(r"courses", views.CourseViewSet, basename="lr_courses_api").register(
    r"contentfiles",
    views.LearningResourceContentFilesViewSet,
    basename="lr_course_content_files_api",
    parents_query_lookups=["run__learning_resource"],
)
router.register(r"programs", views.ProgramViewSet, basename="lr_programs_api")
router.register(
    r"learningpaths", views.LearningPathViewSet, basename="lr_learningpaths_api"
).register(
    r"resources",
    views.LearningPathItemsViewSet,
    basename="lr_learningpathitems_api",
    parents_query_lookups=["parent_id"],
)
router.register(r"podcasts", views.PodcastViewSet, basename="lr_podcasts_api").register(
    r"items",
    views.ResourceListItemsViewSet,
    basename="lr_podcast_items_api",
    parents_query_lookups=["parent_id"],
)
router.register(
    r"podcast_episodes", views.PodcastEpisodeViewSet, basename="lr_podcast_episodes_api"
)
router.register(
    r"contentfiles", views.ContentFileViewSet, basename="lr_contentfiles_api"
)
router.register(r"topics", views.TopicViewSet, basename="lr_topics_api")
router.register(
    r"userlists", views.UserListViewSet, basename="lr_userlists_api"
).register(
    r"resources",
    views.UserListItemViewSet,
    basename="lr_userlistitems_api",
    parents_query_lookups=["parent_id"],
)
router.register(r"topics", views.TopicViewSet, basename="lr_topics_api")
router.register(
    r"content_tags", views.ContentTagViewSet, basename="lr_content_tags_api"
)
router.register(r"departments", views.DepartmentViewSet, basename="lr_departments_api")
router.register(r"platforms", views.PlatformViewSet, basename="lr_platforms_api")
router.register(r"offerors", views.OfferedByViewSet, basename="lr_offerors_api")

urlpatterns = [
    re_path(r"^api/v1/", include(router.urls)),
    re_path(r"api/v1/schema/$", SpectacularAPIView.as_view(), name="schema"),
    re_path(
        "api/v1/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    re_path(
        "api/v1/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    re_path(r"^podcasts/rss_feed", views.podcast_rss_feed, name="podcast-rss-feed"),
    re_path(
        r"^api/v1/ocw_next_webhook/$",
        WebhookOCWNextView.as_view(),
        name="ocw-next-webhook",
    ),
]
