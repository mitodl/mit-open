"""Tests for URLs"""

import re

from django.conf import settings
from django.urls import reverse


def extract_path_parameters(url_pattern):
    """
    Get url params enclosed in <> from a URL pattern.
    """
    pattern = re.compile(r"<([^>.]+?)>")
    return pattern.findall(url_pattern)


def test_index():
    """Test that the index URL is set correctly"""
    assert reverse("main-index") == "/"


def test_api_urls():
    """
    Test that explicitly pins our publicly consumed urls.
    See settings.PINNED_API_ROUTES
    """
    for route in settings.PINNED_API_ROUTES:
        path = route.get("path")
        expected_path = path.replace("<", "").replace(">", "")
        url_args = extract_path_parameters(path)
        resolved_url = reverse(route.get("name"), args=url_args)
        assert resolved_url == expected_path, (
            f"{resolved_url} !== {expected_path} you have changed api path {route['path']}"
            "which other services may rely on."
            " If this is a deliberate change please"
            "update the path in settings.PINNED_API_ROUTES"
        )
