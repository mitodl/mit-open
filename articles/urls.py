"""URL configuration for staff_content"""

from django.urls import include, re_path
from rest_framework.routers import SimpleRouter

from articles import views

v0_router = SimpleRouter()
v0_router.register(
    r"articles",
    views.ArticleViewSet,
    basename="articles",
)

urlpatterns = [
    re_path(r"^api/v1/", include((v0_router.urls, "v1:articles"))),
]
