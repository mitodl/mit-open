"""main constants"""

from rest_framework import status

PERMISSION_DENIED_ERROR_TYPE = "PermissionDenied"
NOT_AUTHENTICATED_ERROR_TYPE = "NotAuthenticated"
DJANGO_PERMISSION_ERROR_TYPES = (
    status.HTTP_401_UNAUTHORIZED,
    status.HTTP_403_FORBIDDEN,
)

ISOFORMAT = "%Y-%m-%dT%H:%M:%SZ"
VALID_HTTP_METHODS = ["get", "post", "patch", "delete"]
ALLOWED_HTML_TAGS = {
    "b",
    "blockquote",
    "br",
    "caption",
    "center",
    "cite",
    "code",
    "div",
    "em",
    "hr",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "q",
    "small",
    "span",
    "strike",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
}
ALLOWED_HTML_ATTRIBUTES = {}
