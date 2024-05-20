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
    r"items", views.ResourceListItemsViewSet, basename="learning_resource_items_api"
)
nested_learning_resources_router.register(
    r"contentfiles",
    views.LearningResourceContentFilesViewSet,
    basename="learning_resource_content_files_api",
)


router.register(r"courses", views.CourseViewSet, basename="courses_api")
nested_courses_router = NestedSimpleRouter(
    router, r"courses", lookup="learning_resource"
)
nested_courses_router.register(
    r"contentfiles",
    views.LearningResourceContentFilesViewSet,
    basename="course_content_files_api",
)
router.register(r"programs", views.ProgramViewSet, basename="programs_api")

router.register(
    r"learningpaths", views.LearningPathViewSet, basename="learningpaths_api"
)
nested_learning_path_router = NestedSimpleRouter(
    router, r"learningpaths", lookup="learning_resource"
)
nested_learning_path_router.register(
    r"items",
    views.LearningPathItemsViewSet,
    basename="learningpathitems_api",
)

router.register(r"podcasts", views.PodcastViewSet, basename="podcasts_api")
nested_podcast_router = NestedSimpleRouter(
    router, r"podcasts", lookup="learning_resource"
)
nested_podcast_router.register(
    r"items",
    views.ResourceListItemsViewSet,
    basename="podcast_items_api",
)

router.register(r"videos", views.VideoViewSet, basename="videos_api")
router.register(
    r"video_playlists", views.VideoPlaylistViewSet, basename="video_playlists_api"
)
nested_video_playlist_router = NestedSimpleRouter(
    router, r"video_playlists", lookup="learning_resource"
)
nested_video_playlist_router.register(
    r"items",
    views.ResourceListItemsViewSet,
    basename="video_playlist_items_api",
)

router.register(
    r"podcast_episodes", views.PodcastEpisodeViewSet, basename="podcast_episodes_api"
)

router.register(r"featured", views.FeaturedViewSet, basename="featured_api")

router.register(r"contentfiles", views.ContentFileViewSet, basename="contentfiles_api")
router.register(r"userlists", views.UserListViewSet, basename="userlists_api")
nested_userlist_router = NestedSimpleRouter(router, r"userlists", lookup="userlist")
nested_userlist_router.register(
    r"items",
    views.UserListItemViewSet,
    basename="userlistitems_api",
)

router.register(r"topics", views.TopicViewSet, basename="topics_api")
router.register(r"departments", views.DepartmentViewSet, basename="departments_api")
router.register(r"schools", views.SchoolViewSet, basename="schools_api")
router.register(r"course_features", views.ContentTagViewSet, basename="contenttags_api")

router.register(r"platforms", views.PlatformViewSet, basename="platforms_api")
router.register(r"offerors", views.OfferedByViewSet, basename="offerors_api")

v1_urls = [
    *router.urls,
    *nested_learning_resources_router.urls,
    *nested_courses_router.urls,
    *nested_learning_path_router.urls,
    *nested_podcast_router.urls,
    *nested_userlist_router.urls,
    *nested_video_playlist_router.urls,
    path(
        "ocw_next_webhook/",
        WebhookOCWView.as_view(),
        name="ocw-next-webhook",
    ),
]

app_name = "lr"
urlpatterns = [
    re_path(r"^api/v1/", include((v1_urls, "v1"))),
    path("podcasts/rss_feed", views.podcast_rss_feed, name="podcast-rss-feed"),
]
