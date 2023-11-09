"""URL configurations for authentication"""

from django.urls import re_path

from authentication.views import CustomLogoutView

urlpatterns = [
    re_path(r"^logout/$", CustomLogoutView.as_view(), name="logout"),
]
