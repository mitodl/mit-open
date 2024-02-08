"""Tests for URLs"""

from django.urls import reverse


def test_index():
    """Test that the index URL is set correctly"""
    assert reverse("main-index") == "/"
