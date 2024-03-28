"""URLs for news_events"""

from django.urls import include, re_path
from rest_framework.routers import SimpleRouter

from news_events import views

router = SimpleRouter()
router.register(
    r"news_events",
    views.FeedItemViewSet,
    basename="news_events_items_api",
)
router.register(
    r"news_events_sources", views.FeedSourceViewSet, basename="news_events_sources_api"
)


v0_urls = [
    *router.urls,
]

app_name = "news_events"
urlpatterns = [
    re_path(r"^api/v0/", include((v0_urls, "v0"))),
]
