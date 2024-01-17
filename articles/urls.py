"""URL configuration for staff_content"""

from django.urls import include, re_path
from rest_framework.routers import SimpleRouter

from articles import views

router = SimpleRouter()
router.register(
    r"articles",
    views.ArticleViewSet,
    basename="articles",
)

urlpatterns = [
    re_path(r"^api/v0/", include((router.urls, "articles"), namespace="v0")),
]
