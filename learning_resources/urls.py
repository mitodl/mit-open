"""Urls for channels"""

from django.urls import include, path, re_path
from rest_framework.routers import SimpleRouter
from rest_framework_nested.routers import NestedSimpleRouter

from learning_resources import views
from learning_resources.views import WebhookOCWView

router = SimpleRouter()
router.register(
    r"learning_resources",
    views.LearningResourceViewSet,
    basename="learning_resources_api",
)

nested_learning_resources_router = NestedSimpleRouter(
    router, r"learning_resources", lookup="learning_resource"
)
nested_learning_resources_router.register(
    r"items", views.ResourceListItemsViewSet, basename="lr_learning_resource_items_api"
)
nested_learning_resources_router.register(
    r"contentfiles",
    views.LearningResourceContentFilesViewSet,
    basename="lr_learning_resource_content_files_api",
)


router.register(r"courses", views.CourseViewSet, basename="lr_courses_api")
nested_courses_router = NestedSimpleRouter(
    router, r"courses", lookup="learning_resource"
)
nested_courses_router.register(
    r"contentfiles",
    views.LearningResourceContentFilesViewSet,
    basename="lr_course_content_files_api",
)
router.register(r"programs", views.ProgramViewSet, basename="lr_programs_api")

router.register(
    r"learningpaths", views.LearningPathViewSet, basename="lr_learningpaths_api"
)
nested_learning_path_router = NestedSimpleRouter(
    router, r"learningpaths", lookup="learning_resource"
)
nested_learning_path_router.register(
    r"items",
    views.LearningPathItemsViewSet,
    basename="lr_learningpathitems_api",
)

router.register(r"podcasts", views.PodcastViewSet, basename="lr_podcasts_api")
nested_podcast_router = NestedSimpleRouter(
    router, r"podcasts", lookup="learning_resource"
)
nested_podcast_router.register(
    r"items",
    views.ResourceListItemsViewSet,
    basename="lr_podcast_items_api",
)


router.register(
    r"podcast_episodes", views.PodcastEpisodeViewSet, basename="lr_podcast_episodes_api"
)

router.register(
    r"contentfiles", views.ContentFileViewSet, basename="lr_contentfiles_api"
)
router.register(r"topics", views.TopicViewSet, basename="lr_topics_api")
router.register(r"userlists", views.UserListViewSet, basename="lr_userlists_api")
nested_userlist_router = NestedSimpleRouter(router, r"userlists", lookup="userlist")
nested_userlist_router.register(
    r"items",
    views.UserListItemViewSet,
    basename="lr_userlistitems_api",
)

router.register(r"topics", views.TopicViewSet, basename="lr_topics_api")
router.register(r"departments", views.DepartmentViewSet, basename="lr_departments_api")
router.register(
    r"course_features", views.ContentTagViewSet, basename="lr_contenttags_api"
)

router.register(r"platforms", views.PlatformViewSet, basename="lr_platforms_api")
router.register(r"offerors", views.OfferedByViewSet, basename="lr_offerors_api")

v1_urls = [
    *router.urls,
    *nested_learning_resources_router.urls,
    *nested_courses_router.urls,
    *nested_learning_path_router.urls,
    *nested_podcast_router.urls,
    *nested_userlist_router.urls,
]


urlpatterns = [
    re_path(r"^api/v1/", include((v1_urls, "learning_resources"), namespace="v1")),
    path("podcasts/rss_feed", views.podcast_rss_feed, name="podcast-rss-feed"),
    path(
        "api/v1/ocw_next_webhook/",
        WebhookOCWView.as_view(),
        name="ocw-next-webhook",
    ),
]
