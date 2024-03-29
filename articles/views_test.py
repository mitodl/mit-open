"""Test for articles views"""

import pytest
from rest_framework.reverse import reverse

from main.factories import UserFactory

pytestmark = [pytest.mark.django_db]


def test_article_creation(staff_client, user):
    """Test article creation HTML sanitization."""

    url = reverse("articles:v1:articles-list")
    data = {
        "html": "<p><script>console.log('hax')</script></p>",
        "title": "Some title",
    }
    resp = staff_client.post(url, data)
    json = resp.json()
    assert json["html"] == "<p></p>"
    assert json["title"] == "Some title"


@pytest.mark.parametrize("is_staff", [True, False])
def test_article_permissions(client, is_staff):
    user = UserFactory.create(is_staff=True)
    client.force_login(user)
    url = reverse("articles:v1:articles-list")
    resp = client.get(url)
    resp.json()
    assert resp.status_code == 200 if is_staff else 403
