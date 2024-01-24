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

app_name = "articles"
urlpatterns = [
    # TODO(Chris Chudzicki): Change this to version v0 when # noqa: FIX002
    #  https://github.com/mitodl/mit-open/issues/269 is finished
    re_path(r"^api/v0/", include((v0_router.urls, "v1"))),
]
