"""URL config for testimonials"""

from django.urls import include, re_path
from rest_framework.routers import DefaultRouter

from testimonials.views import AttestationViewSet

v0_router = DefaultRouter()
v0_router.register(r"testimonials", AttestationViewSet, basename="testimonials_api")

urlpatterns = [re_path(r"^api/v0/", include(v0_router.urls))]
