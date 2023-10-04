from rest_framework import serializers

from articles.serializers import SanitizedHtmlField


class HTMLSantizingSerializer(serializers.Serializer):
    html = SanitizedHtmlField()


def test_html_sanitization():
    serializer = HTMLSantizingSerializer(
        data={"html": "<div><script>console.error('danger!')</script></div>"}
    )
    serializer.is_valid()

    assert serializer.data["html"] == "<div></div>"
