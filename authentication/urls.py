"""URL configurations for authentication"""

from django.urls import include, re_path, reverse_lazy
from django.views.generic.base import RedirectView

from authentication.views import CustomLogoutView

urlpatterns = [
    re_path(r"", include("social_django.urls", namespace="social")),
    re_path(
        r"^login/$",
        RedirectView.as_view(
            url=reverse_lazy("social:begin", args=["ol-oidc"]), query_string=True
        ),
        name="login",
    ),
    re_path(r"^logout/$", CustomLogoutView.as_view(), name="logout"),
]
