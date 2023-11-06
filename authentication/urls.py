"""URL configurations for authentication"""

from django.contrib.auth import views as auth_views
from django.urls import re_path

urlpatterns = [
    re_path(r"^logout/$", auth_views.LogoutView.as_view(), name="logout"),
]
