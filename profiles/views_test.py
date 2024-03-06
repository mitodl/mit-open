"""Tests for views for REST APIs for users"""

# pylint: disable=redefined-outer-name, unused-argument, too-many-arguments
import json
from os.path import basename, splitext

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status

from profiles.factories import ProgramCertificateFactory, ProgramLetterFactory
from profiles.models import ProgramLetter
from profiles.utils import DEFAULT_PROFILE_IMAGE, make_temp_image_file

pytestmark = [pytest.mark.django_db]


def test_list_users(staff_client, staff_user):
    """
    List users
    """
    profile = staff_user.profile
    url = reverse("profile:v0:user_api-list")
    resp = staff_client.get(url)
    assert resp.status_code == 200
    assert resp.json() == [
        {
            "id": staff_user.id,
            "username": staff_user.username,
            "profile": {
                "name": profile.name,
                "image": profile.image,
                "image_small": profile.image_small,
                "image_medium": profile.image_medium,
                "image_file": f"http://testserver{profile.image_file.url}",
                "image_small_file": f"http://testserver{profile.image_small_file.url}",
                "image_medium_file": (
                    f"http://testserver{profile.image_medium_file.url}"
                ),
                "profile_image_small": profile.image_small_file.url,
                "profile_image_medium": profile.image_medium_file.url,
                "bio": profile.bio,
                "headline": profile.headline,
                "username": staff_user.username,
                "placename": profile.location.get("value", ""),
            },
        }
    ]


# These can be removed once all clients have been updated and are sending both these fields
@pytest.mark.parametrize("email_optin", [None, True, False])
@pytest.mark.parametrize("toc_optin", [None, True, False])
def test_create_user(staff_client, staff_user, mocker, email_optin, toc_optin):  # pylint: disable=too-many-arguments
    """
    Create a user and assert the response
    """
    staff_user.email = ""
    staff_user.profile.email_optin = None
    staff_user.profile.save()
    staff_user.save()
    url = reverse("profile:v0:user_api-list")
    email = "test.email@example.com"
    payload = {
        "email": email,
        "profile": {
            "name": "name",
            "image": "image",
            "image_small": "image_small",
            "image_medium": "image_medium",
            "bio": "bio",
            "headline": "headline",
            "placename": "",
        },
    }
    if email_optin is not None:
        payload["profile"]["email_optin"] = email_optin
    if toc_optin is not None:
        payload["profile"]["toc_optin"] = toc_optin

    resp = staff_client.post(url, data=payload)
    user = User.objects.get(username=resp.json()["username"])
    assert resp.status_code == 201
    for optin in ("email_optin", "toc_optin"):
        if optin in payload["profile"]:
            del payload["profile"][optin]
    payload["profile"].update(
        {
            "image_file": None,
            "image_small_file": None,
            "image_medium_file": None,
            "username": user.username,
            "profile_image_small": "image_small",
            "profile_image_medium": "image_medium",
        }
    )
    assert resp.json()["profile"] == payload["profile"]
    assert user.email == email
    assert user.profile.email_optin is email_optin
    assert user.profile.toc_optin is toc_optin


def test_get_user(staff_client, user):
    """
    Get a user
    """
    profile = user.profile
    url = reverse("profile:v0:user_api-detail", kwargs={"username": user.username})
    resp = staff_client.get(url)
    assert resp.status_code == 200
    assert resp.json() == {
        "id": user.id,
        "username": user.username,
        "profile": {
            "name": profile.name,
            "image": profile.image,
            "image_small": profile.image_small,
            "image_medium": profile.image_medium,
            "image_file": f"http://testserver{profile.image_file.url}",
            "image_small_file": f"http://testserver{profile.image_small_file.url}",
            "image_medium_file": f"http://testserver{profile.image_medium_file.url}",
            "profile_image_small": profile.image_small_file.url,
            "profile_image_medium": profile.image_medium_file.url,
            "bio": profile.bio,
            "headline": profile.headline,
            "username": profile.user.username,
            "placename": profile.location.get("value", ""),
        },
    }


@pytest.mark.parametrize("logged_in", [True, False])
def test_get_profile(logged_in, user, user_client):
    """Anonymous users should be able to view a person's profile"""
    profile = user.profile
    url = reverse(
        "profile:v0:profile_api-detail", kwargs={"user__username": user.username}
    )
    resp = user_client.get(url)
    if not logged_in:
        user_client.logout()
    assert resp.status_code == 200
    assert resp.json() == {
        "name": profile.name,
        "image": profile.image,
        "image_small": profile.image_small,
        "image_medium": profile.image_medium,
        "image_file": f"{profile.image_file.url}",
        "image_small_file": f"{profile.image_small_file.url}",
        "image_medium_file": f"{profile.image_medium_file.url}",
        "profile_image_small": profile.image_small_file.url,
        "profile_image_medium": profile.image_medium_file.url,
        "bio": profile.bio,
        "headline": profile.headline,
        "username": profile.user.username,
        "placename": profile.location.get("value", ""),
        "user_websites": [],
    }


@pytest.mark.parametrize("email", ["", "test.email@example.com"])
@pytest.mark.parametrize("email_optin", [None, True, False])
@pytest.mark.parametrize("toc_optin", [None, True, False])
def test_patch_user(staff_client, user, email, email_optin, toc_optin):
    """
    Update a users' profile
    """
    user.email = ""
    user.save()
    profile = user.profile
    profile.email_optin = None
    profile.save()
    payload = {"profile": {"name": "othername"}}
    if email:
        payload["email"] = email
    if email_optin is not None:
        payload["profile"]["email_optin"] = email_optin
    if toc_optin is not None:
        payload["profile"]["toc_optin"] = toc_optin
    url = reverse("profile:v0:user_api-detail", kwargs={"username": user.username})
    resp = staff_client.patch(url, data=payload)
    assert resp.status_code == 200
    assert resp.json() == {
        "id": user.id,
        "username": user.username,
        "profile": {
            "name": "othername",
            "image": profile.image,
            "image_small": profile.image_small,
            "image_medium": profile.image_medium,
            "image_file": f"http://testserver{profile.image_file.url}",
            "image_small_file": f"http://testserver{profile.image_small_file.url}",
            "image_medium_file": f"http://testserver{profile.image_medium_file.url}",
            "profile_image_small": profile.image_small_file.url,
            "profile_image_medium": profile.image_medium_file.url,
            "bio": profile.bio,
            "headline": profile.headline,
            "username": profile.user.username,
            "placename": profile.location.get("value", ""),
        },
    }
    user.refresh_from_db()
    profile.refresh_from_db()
    assert user.email == email
    assert profile.email_optin is email_optin
    assert profile.toc_optin is toc_optin


def test_patch_username(staff_client, user):
    """
    Trying to update a users's username does not change anything
    """
    url = reverse("profile:v0:user_api-detail", kwargs={"username": user.username})
    resp = staff_client.patch(url, data={"username": "notallowed"})
    assert resp.status_code == 200
    assert resp.json()["username"] == user.username


def test_patch_profile_by_user(client, logged_in_profile):
    """
    Test that users can update their profiles, including profile images
    """
    url = reverse(
        "profile:v0:profile_api-detail",
        kwargs={"user__username": logged_in_profile.user.username},
    )
    # create a dummy image file in memory for upload
    location_json = {"value": "Boston"}
    with make_temp_image_file(width=250, height=250) as image_file:
        # format patch using multipart upload
        resp = client.patch(
            url,
            data={
                "bio": "updated_bio_value",
                "image_file": image_file,
                "location": json.dumps(location_json),
            },
            format="multipart",
        )
    filename, ext = splitext(image_file.name)  # noqa: PTH122
    assert resp.status_code == 200
    assert resp.json()["bio"] == "updated_bio_value"
    assert resp.json()["placename"] == "Boston"
    assert basename(filename) in resp.json()["image_file"]  # noqa: PTH119
    assert resp.json()["image_file"].endswith(ext)
    assert resp.json()["image_small_file"].endswith(".jpg")

    logged_in_profile.refresh_from_db()
    assert logged_in_profile.image_file.height == 250
    assert logged_in_profile.image_file.width == 250
    assert logged_in_profile.image_small_file.height == 64
    assert logged_in_profile.image_small_file.width == 64
    assert logged_in_profile.image_medium_file.height == 128
    assert logged_in_profile.image_medium_file.width == 128
    assert logged_in_profile.location == location_json


def test_initialized_avatar(client, user):
    """
    Test that a PNG avatar image is returned for a user
    """
    url = reverse(
        "profile:name-initials-avatar",
        kwargs={
            "username": user.username,
            "color": "afafaf",
            "bgcolor": "dedede",
            "size": 92,
        },
    )
    resp = client.get(url)
    assert resp.status_code == 200
    assert (
        resp.__getitem__("Content-Type")  # pylint:disable=unnecessary-dunder-call
        == "image/png"
    )


def test_initials_avatar_fake_user(client):
    """
    Test that a default avatar image is returned for a fake user
    """
    url = reverse(
        "profile:name-initials-avatar",
        kwargs={
            "username": "fakeuser",
            "color": "afafaf",
            "bgcolor": "dedede",
            "size": 92,
        },
    )
    response = client.get(url, follow=True)
    last_url, _ = response.redirect_chain[-1]
    assert last_url.endswith(DEFAULT_PROFILE_IMAGE)


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_get_user_by_me(mocker, client, user, is_anonymous):
    """Test that user can request their own user by the 'me' alias"""
    if not is_anonymous:
        client.force_login(user)
    resp = client.get(reverse("profile:v0:users_api-me"))

    if is_anonymous:
        assert resp.status_code == status.HTTP_403_FORBIDDEN
    else:
        profile = user.profile
        assert resp.json() == {
            "id": user.id,
            "username": user.username,
            "profile": {
                "name": profile.name,
                "image": profile.image,
                "image_small": profile.image_small,
                "image_medium": profile.image_medium,
                "image_file": f"http://testserver{profile.image_file.url}",
                "image_small_file": f"http://testserver{profile.image_small_file.url}",
                "image_medium_file": f"http://testserver{profile.image_medium_file.url}",
                "profile_image_small": profile.image_small_file.url,
                "profile_image_medium": profile.image_medium_file.url,
                "bio": profile.bio,
                "headline": profile.headline,
                "username": profile.user.username,
                "placename": profile.location.get("value", ""),
            },
        }


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_letter_intercept_view_generates_program_letter(
    mocker, client, user, is_anonymous
):
    """
    Test that the letter intercept view generates a
    ProgramLetter and then passes the user along to the display.
    Also test that anonymous users do not generate letters and cant access this page
    """
    mocker.patch(
        "profiles.views.fetch_program_letter_template_data",
        return_value={
            "id": 4,
            "title": "Supply Chain Management",
            "program_id": 1,
            "program_letter_footer_text": "",
            "program_letter_header_text": "",
            "program_letter_text": "<p>Congratulations</p>",
            "program_letter_signatories": [],
        },
    )
    micromasters_program_id = 1
    if not is_anonymous:
        client.force_login(user)
        cert = ProgramCertificateFactory(
            user_email=user.email, micromasters_program_id=micromasters_program_id
        )
        assert ProgramLetter.objects.filter(user=user).count() == 0

        response = client.get(
            reverse("profile:program-letter-intercept", args=[micromasters_program_id])
        )
        assert ProgramLetter.objects.filter(user=user).count() == 1
        letter_id = ProgramLetter.objects.get(user=user, certificate=cert).id
        assert response.url == reverse("profile:program-letter-view", args=[letter_id])
    else:
        cert = ProgramCertificateFactory(
            user_email=user.email, micromasters_program_id=micromasters_program_id
        )
        program_letter = ProgramLetterFactory(user=user, certificate=cert)
        response = client.get(
            reverse("profile:program-letter-intercept", args=[micromasters_program_id])
        )
        assert response.status_code == 302
        # test that the anonymous user can still view other user's program letter
        response = client.get(
            reverse("profile:program-letter-view", args=[program_letter.id])
        )
        assert response.status_code == 200


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_letter_view_renders_letter(mocker, client, user, is_anonymous):
    """
    Test that the program letter display page is viewable by
    all users logged in or not
    """
    mock_return_value = {
        "id": 4,
        "title": "Supply Chain Management",
        "program_id": 1,
        "program_letter_footer_text": "",
        "program_letter_header_text": "",
        "program_letter_text": "<p>Congratulations</p>",
        "program_letter_signatories": [],
    }
    mocker.patch(
        "profiles.views.fetch_program_letter_template_data",
        return_value=mock_return_value,
    )
    micromasters_program_id = 1
    if not is_anonymous:
        client.force_login(user)
    cert = ProgramCertificateFactory(
        user_email=user.email, micromasters_program_id=micromasters_program_id
    )
    program_letter = ProgramLetterFactory(user=user, certificate=cert)
    response = client.get(
        reverse("profile:program-letter-view", args=[program_letter.id])
    )
    content = str(response.content)
    assert mock_return_value["title"] in content
    assert mock_return_value["program_letter_text"] in content


def test_empty_page_template_raises_404(mocker, client, user):
    """
    Test that the program letter display page is viewable by
    all users logged in or not
    """
    mock_return_value = None
    mocker.patch(
        "profiles.views.fetch_program_letter_template_data",
        return_value=mock_return_value,
    )
    micromasters_program_id = 1
    cert = ProgramCertificateFactory(
        user_email=user.email, micromasters_program_id=micromasters_program_id
    )
    program_letter = ProgramLetterFactory(user=user, certificate=cert)
    response = client.get(
        reverse("profile:program-letter-view", args=[program_letter.id])
    )
    assert response.status_code == 404
