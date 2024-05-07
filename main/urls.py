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
from rest_framework.routers import DefaultRouter

from main.views import FeaturesViewSet, index

# Post slugs can contain unicode characters, so a letter-matching pattern like [A-Za-z] doesn't work.  # noqa: E501
# "[^\W]" Matches any character that is NOT a non-alphanumeric character, including underscores.  # noqa: E501
# "[^\W]" will match all numbers, underscores, and letters, unicode or otherwise. To accept dashes  # noqa: E501
# as well, that character is added to the pattern via an alternation (|).
POST_SLUG_PATTERN = "([^\\W]|-)+"

handler400 = "main.views.handle_400"
handler403 = "main.views.handle_403"
handler404 = "main.views.handle_404"

features_router = DefaultRouter()
features_router.register(r"_/features", FeaturesViewSet, basename="features")

urlpatterns = [  # noqa: RUF005
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
    re_path(r"", include("personalization.urls")),
    # React App
    re_path(r"^$", index, name="main-index"),
    re_path(r"^privacy-statement/", index, name="privacy-statement"),
    re_path(r"^search/", index, name="site-search"),
    re_path(r"^learningpaths/", index, name="learningpaths"),
    re_path(r"^userlists/", index, name="userlists"),
    re_path(r"^articles/", index, name="articles"),
    re_path(r"^dashboard/", index, name="dashboard"),
    re_path(r"^program_letter/", index, name="programletter"),
    re_path(r"^c/", index, name="channels"),
    re_path(r"", include(features_router.urls)),
    # Hijack
    re_path(r"^hijack/", include("hijack.urls", namespace="hijack")),
    re_path(r"", include("news_events.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar  # pylint: disable=wrong-import-position, wrong-import-order

    urlpatterns += [re_path(r"^__debug__/", include(debug_toolbar.urls))]
