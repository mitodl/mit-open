"""project URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic.base import RedirectView
from rest_framework.routers import DefaultRouter

from main.views import FeaturesViewSet

# Post slugs can contain unicode characters, so a letter-matching pattern like [A-Za-z] doesn't work.  # noqa: E501
# "[^\W]" Matches any character that is NOT a non-alphanumeric character, including underscores.  # noqa: E501
# "[^\W]" will match all numbers, underscores, and letters, unicode or otherwise. To accept dashes  # noqa: E501
# as well, that character is added to the pattern via an alternation (|).
POST_SLUG_PATTERN = "([^\\W]|-)+"

handler400 = "main.views.handle_error"
handler403 = "main.views.handle_error"
handler404 = "main.views.handle_error"

features_router = DefaultRouter()
features_router.register(r"_/features", FeaturesViewSet, basename="features")

urlpatterns = (
    [  # noqa: RUF005
        path("scim/v2/", include("django_scim.urls")),
        re_path(r"^o/", include("oauth2_provider.urls", namespace="oauth2_provider")),
        re_path(r"^admin/", admin.site.urls),
        re_path(r"", include("authentication.urls")),
        re_path(r"", include("channels.urls")),
        re_path(r"", include("profiles.urls")),
        re_path(r"", include("embedly.urls")),
        re_path(r"", include("learning_resources_search.urls")),
        re_path(r"", include("ckeditor.urls")),
        re_path(r"", include("widgets.urls")),
        re_path(r"", include("openapi.urls")),
        re_path(r"", include("learning_resources.urls")),
        re_path(r"", include("articles.urls")),
        re_path(r"", include("testimonials.urls")),
        re_path(r"", include("news_events.urls")),
        # React App
        re_path(
            r"^$", RedirectView.as_view(url=settings.APP_BASE_URL), name="main-index"
        ),
        re_path(r"^app", RedirectView.as_view(url=settings.APP_BASE_URL)),
        re_path(r"", include(features_router.urls)),
        re_path(r"^silk/", include("silk.urls", namespace="silk")),
        # Hijack
        re_path(r"^hijack/", include("hijack.urls", namespace="hijack")),
    ]
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
)

if settings.DEBUG:
    import debug_toolbar  # pylint: disable=wrong-import-position, wrong-import-order

    urlpatterns += [re_path(r"^__debug__/", include(debug_toolbar.urls))]
