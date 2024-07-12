"""Tests for views for REST APIs for users"""

# pylint: disable=redefined-outer-name, unused-argument, too-many-arguments
import json

import pytest
from django.conf import settings
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status

from learning_resources.constants import LearningResourceFormat
from learning_resources.factories import LearningResourceTopicFactory
from learning_resources.serializers import LearningResourceTopicSerializer
from learning_resources_search.serializers_test import get_request_object
from profiles.factories import ProgramCertificateFactory, ProgramLetterFactory
from profiles.models import Profile
from profiles.serializers import (
    ProfileSerializer,
    ProgramCertificateSerializer,
    ProgramLetterSerializer,
)
from profiles.utils import DEFAULT_PROFILE_IMAGE, IMAGE_MEDIUM, IMAGE_SMALL, image_uri

pytestmark = [pytest.mark.django_db]


def test_list_users(staff_client, staff_user):
    """
    List users
    """
    url = reverse("profile:v0:user_api-list")
    resp = staff_client.get(url)
    assert resp.status_code == 200
    assert resp.json() == [
        {
            "id": staff_user.id,
            "username": staff_user.username,
            "first_name": staff_user.first_name,
            "last_name": staff_user.last_name,
            "is_learning_path_editor": True,
            "is_article_editor": True,
            "profile": ProfileSerializer(staff_user.profile).data,
        }
    ]


# These can be removed once all clients have been updated and are sending both these fields
@pytest.mark.parametrize("email_optin", [None, True, False])
@pytest.mark.parametrize("toc_optin", [None, True, False])
def test_create_user(staff_client, staff_user, email_optin, toc_optin):  # pylint: disable=too-many-arguments
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
    assert resp.json()["profile"] == ProfileSerializer(user.profile).data
    assert user.email == email
    assert user.profile.email_optin is email_optin
    assert user.profile.toc_optin is toc_optin


def test_get_user(staff_client, user):
    """
    Get a user
    """
    url = reverse("profile:v0:user_api-detail", kwargs={"username": user.username})
    resp = staff_client.get(url)
    assert resp.status_code == 200
    assert resp.json() == {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_article_editor": True,
        "is_learning_path_editor": True,
        "profile": ProfileSerializer(user.profile).data,
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
        "image_small": None,
        "image_medium": None,
        "image_file": None,
        "image_small_file": None,
        "image_medium_file": None,
        "profile_image_small": image_uri(profile, IMAGE_SMALL),
        "profile_image_medium": image_uri(profile, IMAGE_MEDIUM),
        "bio": profile.bio,
        "headline": profile.headline,
        "username": profile.user.username,
        "placename": profile.location.get("value", ""),
        "user_websites": [],
        "topic_interests": LearningResourceTopicSerializer(
            profile.topic_interests, many=True
        ).data,
        "goals": profile.goals,
        "current_education": profile.current_education,
        "certificate_desired": profile.certificate_desired,
        "time_commitment": profile.time_commitment,
        "learning_format": profile.learning_format,
        "preference_search_filters": {
            "learning_format": [profile.learning_format],
            "certification": (
                profile.certificate_desired == Profile.CertificateDesired.YES.value
            ),
        },
    }


def test_get_profile_automatically_creates_profile(user, user_client):
    """Profiles should automatically get created for users without one"""
    user.profile.delete()
    url = reverse("profile:v0:profile_api-detail", kwargs={"user__username": "me"})
    resp = user_client.get(url)
    assert resp.status_code == 200
    user.refresh_from_db()
    assert user.profile is not None


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
    user.refresh_from_db()
    profile.refresh_from_db()
    assert resp.status_code == 200
    assert resp.json() == {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_learning_path_editor": True,
        "is_article_editor": True,
        "profile": ProfileSerializer(user.profile).data,
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
    resp = client.patch(
        url,
        data={
            "bio": "updated_bio_value",
            "location": json.dumps(location_json),
        },
        format="multipart",
    )
    assert resp.status_code == 200
    assert resp.json()["bio"] == "updated_bio_value"
    assert resp.json()["placename"] == "Boston"

    logged_in_profile.refresh_from_db()
    assert logged_in_profile.location == location_json


def test_patch_topic_interests(client, logged_in_profile):
    """Test that patching Profile.topic_interests works correctly"""
    topics = LearningResourceTopicFactory.create_batch(3)
    topic_ids = {topic.id for topic in topics}

    url = reverse(
        "profile:v0:profile_api-detail",
        kwargs={"user__username": logged_in_profile.user.username},
    )

    assert logged_in_profile.topic_interests.count() == 0

    resp = client.patch(
        url,
        data={
            "topic_interests": [topic.id for topic in topics],
        },
    )

    assert resp.status_code == status.HTTP_200_OK

    assert sorted(
        resp.json()["topic_interests"], key=lambda topic: topic["id"]
    ) == sorted(
        LearningResourceTopicSerializer(topics, many=True).data,
        key=lambda topic: topic["id"],
    )

    logged_in_profile.refresh_from_db()

    assert logged_in_profile.topic_interests.count() == len(topics)

    profile_topic_ids = {topic.id for topic in logged_in_profile.topic_interests.all()}

    assert profile_topic_ids == topic_ids


@pytest.mark.parametrize(
    ("field", "before", "value", "after"),
    [
        (
            "goals",
            [],
            [Profile.Goal.LIFELONG_LEARNING],
            [Profile.Goal.LIFELONG_LEARNING],
        ),
        (
            "certificate_desired",
            "",
            Profile.CertificateDesired.YES,
            Profile.CertificateDesired.YES,
        ),
        (
            "current_education",
            "",
            Profile.CurrentEducation.MASTERS,
            Profile.CurrentEducation.MASTERS,
        ),
        (
            "time_commitment",
            "",
            Profile.TimeCommitment.ZERO_TO_FIVE_HOURS,
            Profile.TimeCommitment.ZERO_TO_FIVE_HOURS,
        ),
        (
            "learning_format",
            "",
            LearningResourceFormat.hybrid.name,
            LearningResourceFormat.hybrid.name,
        ),
    ],
)
def test_patch_onboarding_fields(  # noqa: PLR0913
    client, logged_in_profile, field, before, value, after
):
    """Test that patching Profile onboarding fields works correctly"""
    url = reverse(
        "profile:v0:profile_api-detail",
        kwargs={"user__username": logged_in_profile.user.username},
    )

    setattr(logged_in_profile, field, before)
    logged_in_profile.save()
    logged_in_profile.refresh_from_db()
    assert getattr(logged_in_profile, field) == before

    resp = client.patch(
        url,
        data={
            (field): after,
        },
    )

    assert resp.status_code == status.HTTP_200_OK

    logged_in_profile.refresh_from_db()

    assert resp.json()[field] == after
    assert getattr(logged_in_profile, field) == after


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
        assert resp.json() == {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_learning_path_editor": False,
            "is_article_editor": False,
            "profile": ProfileSerializer(user.profile).data,
        }


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_program_letter_api_view(mocker, client, rf, user, is_anonymous, settings):  # noqa: PLR0913
    """
    Test that the program letter display page is viewable by
    all users logged in or not
    """
    settings.DATABASE_ROUTERS = []
    mock_return_value = {
        "id": 4,
        "meta": {},
        "program_letter_footer": "",
        "program_letter_logo": {},
        "title": "Supply Chain Management",
        "program_id": 1,
        "program_letter_footer_text": "",
        "program_letter_header_text": "",
        "program_letter_text": "<p>Congratulations</p>",
        "program_letter_signatories": [],
    }
    mocker.patch(
        "profiles.serializers.fetch_program_letter_template_data",
        return_value=mock_return_value,
    )
    micromasters_program_id = 1
    if not is_anonymous:
        client.force_login(user)
    cert = ProgramCertificateFactory(
        user_email=user.email, micromasters_program_id=micromasters_program_id
    )
    program_letter = ProgramLetterFactory(user=user, certificate=cert)
    letter_url = reverse(
        "profile:v1:program_letters_api-detail", args=[program_letter.id]
    )
    response = client.get(letter_url)
    assert (
        response.data
        == ProgramLetterSerializer(
            instance=program_letter, context={"request": rf.get(letter_url)}
        ).data
    )


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_program_letter_api_view_returns_404_for_invalid_id(
    mocker, client, user, is_anonymous
):
    """
    Test that the program letter api responds with 404
    for malformed uuids
    """
    response = client.get(
        reverse(
            "profile:v1:program_letters_api-detail",
            args=["5de96fc0-449e-4668-be89-a119dbdcab799999"],
        )
    )
    assert response.status_code == 404


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_list_user_program_certificates(mocker, client, user, is_anonymous):
    """
    Test listing program certificates for a user
    """
    settings.DATABASE_ROUTERS = []
    settings.EXTERNAL_MODELS = []
    if not is_anonymous:
        client.force_login(user)
        certs = ProgramCertificateFactory.create_batch(
            3,
            user_email=user.email,
        )
    url = reverse("profile:v0:user_program_certificates_api-list")
    resp = client.get(url)
    if not is_anonymous:
        request = get_request_object(url)
        assert resp.status_code == 200
        assert (
            resp.json()
            == ProgramCertificateSerializer(
                certs, many=True, context={"request": request}
            ).data
        )
    else:
        assert resp.status_code == 403
