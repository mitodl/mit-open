"""URL configurations for authentication"""
from django.urls import re_path
from django.contrib.auth import views as auth_views


urlpatterns = [
    re_path(r"^logout/$", auth_views.LogoutView.as_view(), name="logout"),
]
