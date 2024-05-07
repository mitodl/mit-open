"""Urls for personalization"""

from django.urls import include, re_path
from rest_framework.routers import SimpleRouter

from personalization import views

router = SimpleRouter()
router.register(
    r"personalization",
    views.PersonalizationViewSet,
    basename="personalization_api",
)
v1_urls = [
    *router.urls,
]

app_name = "personalization"
urlpatterns = [
    re_path(r"^api/v0/", include((v1_urls, "v0"))),
]
