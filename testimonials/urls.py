"""URL config for testimonials"""

from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from testimonials.views import AttestationViewSet, FeaturedAttestationViewSet

v0_router = DefaultRouter()
v0_router.register(
    r"featured_testimonials",
    FeaturedAttestationViewSet,
    basename="featured_testimonials_api",
)
v0_router.register(r"testimonials", AttestationViewSet, basename="testimonials_api")

v0_urls = [
    re_path(r"", include(v0_router.urls)),
]

app_name = "testimonials"
urlpatterns = [
    re_path("^api/v0/", include((v0_urls, "v0"))),
]
