"""URL configuration for staff_content"""

from django.urls import include, re_path
from rest_framework.routers import SimpleRouter

from articles import views

v1_router = SimpleRouter()
v1_router.register(
    r"articles",
    views.ArticleViewSet,
    basename="articles",
)

app_name = "articles"
urlpatterns = [
    # TODO(Chris Chudzicki): Change this to version v0 when # noqa: FIX002
    #  https://github.com/mitodl/mit-learn/issues/269 is finished
    #  mit-learn-api-clients will be responsible for generating v0+v1+... clients
    re_path(r"^api/v1/", include((v1_router.urls, "v1"))),
]
