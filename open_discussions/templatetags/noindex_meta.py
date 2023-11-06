"""Adds in noindex meta tag to all pages for non-production environments."""

from django import template
from django.conf import settings
from django.utils.html import format_html

register = template.Library()


@register.simple_tag()
def noindex_meta():
    """Add noindex for non-production environments."""
    return (
        format_html("""<meta name="robots" content="noindex">""")
        if settings.ENVIRONMENT not in ("production", "prod")
        else ""
    )
