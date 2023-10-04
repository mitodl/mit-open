"""URL configuration for staff_content"""
from django.urls import include, re_path
from rest_framework_extensions.routers import ExtendedSimpleRouter

from staff_posts import views

router = ExtendedSimpleRouter()
router.register(
    r"staff_posts",
    views.StaffPostViewSet,
    basename="staff_posts",
)

urlpatterns = [
    re_path(r"^api/v1/", include(router.urls)),
]
