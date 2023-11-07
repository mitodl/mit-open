"""URL configurations for authentication"""

from django.urls import path, re_path

from authentication.views import CustomLogoutView, backend_logout

urlpatterns = [
    re_path(r"^logout/$", CustomLogoutView.as_view(), name="logout"),
    path(
        "backend-logout/",
        backend_logout,
        name="backend-logout",
    ),
]
