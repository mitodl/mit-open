# pylint: disable=unused-argument,too-many-arguments,redefined-outer-name
"""
Tests for serializers for profiles REST APIS
"""

import factory
import pytest
from rest_framework.exceptions import ValidationError

from learning_resources.constants import LearningResourceFormat
from learning_resources.factories import LearningResourceTopicFactory
from learning_resources.serializers import LearningResourceTopicSerializer
from profiles.factories import UserWebsiteFactory
from profiles.models import FACEBOOK_DOMAIN, PERSONAL_SITE_TYPE, Profile
from profiles.serializers import (
    ProfileSerializer,
    UserSerializer,
    UserWebsiteSerializer,
)
from profiles.utils import (
    IMAGE_MEDIUM,
    IMAGE_SMALL,
    image_uri,
)

small_gif = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04"
    b"\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02"
    b"\x02\x4c\x01\x00\x3b"
)


def test_serialize_user(user):
    """
    Test serializing a user
    """
    assert UserSerializer(user).data == {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_learning_path_editor": False,
        "is_article_editor": False,
        "profile": ProfileSerializer(user.profile).data,
    }


def test_serialize_create_user(db, mocker):
    """
    Test creating a user
    """
    profile = {
        "name": "name",
        "email_optin": True,
        "toc_optin": True,
        "bio": "bio",
        "headline": "headline",
        "placename": "",
    }

    serializer = UserSerializer(data={"email": "test@localhost", "profile": profile})
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    del profile["email_optin"]  # is write-only
    del profile["toc_optin"]  # is write-only

    profile.update(
        {
            "image": None,
            "image_small": None,
            "image_medium": None,
            "image_file": None,
            "image_small_file": None,
            "image_medium_file": None,
            "profile_image_small": image_uri(user.profile, IMAGE_SMALL),
            "profile_image_medium": image_uri(user.profile, IMAGE_MEDIUM),
            "username": user.username,
            "topic_interests": LearningResourceTopicSerializer(
                user.profile.topic_interests, many=True
            ).data,
            "goals": user.profile.goals,
            "current_education": user.profile.current_education,
            "certificate_desired": user.profile.certificate_desired,
            "time_commitment": user.profile.time_commitment,
            "learning_format": user.profile.learning_format,
        }
    )
    assert UserSerializer(instance=user).data == {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_learning_path_editor": False,
        "is_article_editor": False,
        "profile": {**profile, "preference_search_filters": {}},
    }


@pytest.mark.parametrize(
    ("key", "value"),
    [
        ("name", "name_value"),
        ("email_optin", True),
        ("email_optin", False),
        ("bio", "bio_value"),
        ("headline", "headline_value"),
        ("toc_optin", True),
        ("toc_optin", False),
    ],
)
def test_update_user_profile(mocker, user, key, value):
    """
    Test updating a profile via the UserSerializer
    """
    profile = user.profile

    serializer = UserSerializer(
        instance=user, data={"profile": {key: value}}, partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    profile2 = Profile.objects.get(user=user)

    for prop in (
        "name",
        "image",
        "image_small",
        "image_medium",
        "email_optin",
        "toc_optin",
        "bio",
        "headline",
    ):
        if prop == key:
            if isinstance(value, bool):
                assert getattr(profile2, prop) is value
            else:
                assert getattr(profile2, prop) == value
        else:
            assert getattr(profile2, prop) == getattr(profile, prop)


@pytest.mark.parametrize(
    ("topic_interests", "errors"),
    [
        ("just_a_string", ["Should be a list of topic integer ids"]),
        (["id_as_string"], ["Should be a list of topic integer ids"]),
        ([{"id": 1}], ["Should be a list of topic integer ids"]),
        ([99999999], ["Invalid id(s): 99999999"]),  # missing topic
    ],
)
def test_serializer_profile_topic_interests_invalid(user, topic_interests, errors):
    """Test that invalid topic_interests are rejected"""

    serializer = ProfileSerializer(
        instance=user,
        data={
            "topic_interests": topic_interests,
        },
        partial=True,
    )

    serializer.is_valid()

    assert serializer.errors == {
        "topic_interests": errors,
    }


@pytest.mark.parametrize(
    ("data", "is_valid"),
    [
        ({}, True),
        ("notjson", False),
        ({"bad": "json"}, False),
        (None, True),
        ({"value": "city"}, True),
    ],
)
def test_location_validation(user, data, is_valid):
    """Test that lcoation validation works correctly"""
    serializer = ProfileSerializer(
        instance=user.profile, data={"location": data}, partial=True
    )
    assert serializer.is_valid(raise_exception=False) is is_valid


@pytest.mark.parametrize(
    ("key", "value"),
    [
        ("name", "name_value"),
        ("bio", "bio_value"),
        ("headline", "headline_value"),
        ("location", {"value": "Hobbiton, The Shire, Middle-Earth"}),
    ],
)
def test_update_profile(mocker, user, key, value):
    """
    Test updating a profile via the ProfileSerializer
    """
    profile = user.profile

    serializer = ProfileSerializer(
        instance=user.profile, data={key: value}, partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    profile2 = Profile.objects.first()

    for prop in (
        "name",
        "email_optin",
        "toc_optin",
        "bio",
        "headline",
        "location",
    ):
        if prop == key:
            if isinstance(value, bool):
                assert getattr(profile2, prop) is value
            else:
                assert getattr(profile2, prop) == value
        else:
            assert getattr(profile2, prop) == getattr(profile, prop)


@pytest.mark.django_db()
@pytest.mark.parametrize(
    ("cert_desired", "cert_filter"),
    [
        (Profile.CertificateDesired.YES.value, True),
        (Profile.CertificateDesired.NO.value, False),
        (Profile.CertificateDesired.NOT_SURE_YET.value, None),
        ("", None),
    ],
)
@pytest.mark.parametrize("topics", [["Biology", "Chemistry"], []])
@pytest.mark.parametrize("lr_format", [LearningResourceFormat.hybrid.name, ""])
def test_serialize_profile_preference_search_filters(
    user, cert_desired, cert_filter, topics, lr_format
):
    """Tests that the ProfileSerializer includes search filters when an option is set via the context"""
    profile = user.profile
    profile.certificate_desired = cert_desired
    profile.learning_format = lr_format
    if topics:
        profile.topic_interests.set(
            [LearningResourceTopicFactory.create(name=topic) for topic in topics]
        )
    profile.save()

    search_filters = ProfileSerializer(profile).data["preference_search_filters"]
    assert search_filters.get("certification", None) == cert_filter
    assert search_filters.get("topics", None) == (topics if topics else None)
    assert search_filters.get("learning_format", None) == (
        lr_format if lr_format else None
    )


def test_serialize_profile_websites(user):
    """Tests that the ProfileSerializer includes UserWebsite information when an option is set via the context"""
    profile = user.profile
    user_websites = UserWebsiteFactory.create_batch(
        2,
        profile=profile,
        site_type=factory.Iterator([PERSONAL_SITE_TYPE, FACEBOOK_DOMAIN]),
    )
    serialized_profile = ProfileSerializer(
        profile, context={"include_user_websites": True}
    ).data
    serialized_sites = UserWebsiteSerializer(user_websites, many=True).data
    assert len(serialized_profile["user_websites"]) == 2
    # Check that the two lists of OrderedDicts are equivalent
    assert sorted(
        [list(data.items()) for data in serialized_profile["user_websites"]]
    ) == sorted([list(data.items()) for data in serialized_sites])


class TestUserWebsiteSerializer:
    """UserWebsiteSerializer tests"""

    def test_serialize(self):
        """
        Test serializing a user website
        """
        user_website = UserWebsiteFactory.build()
        assert UserWebsiteSerializer(user_website).data == {
            "id": user_website.id,
            "url": user_website.url,
            "site_type": user_website.site_type,
        }

    def test_deserialize(self, mocker, user):
        """
        Test deserializing a user website
        """
        url = "https://example.com"
        site_type = "dummy"
        patched_get_site_type = mocker.patch(
            "profiles.serializers.get_site_type_from_url", return_value=site_type
        )
        user_website_data = {"username": user.username, "url": url}

        serializer = UserWebsiteSerializer(data=user_website_data)
        is_valid = serializer.is_valid(raise_exception=True)
        assert is_valid is True
        assert serializer.validated_data["url"] == url
        assert serializer.validated_data["site_type"] == site_type
        assert serializer.validated_data["profile"] == user.profile
        patched_get_site_type.assert_called_once_with(url)

    @pytest.mark.parametrize(
        ("input_url", "exp_result_url"),
        [("HTtPS://AbC.COM", "https://abc.com"), ("AbC.cOM", "http://abc.com")],
    )
    def test_user_website_url(self, mocker, user, input_url, exp_result_url):
        """
        Test that deserializing a user website url adds a protocol if necessary and forces lowercase.
        """
        site_type = "dummy"
        mocker.patch(
            "profiles.serializers.get_site_type_from_url", return_value=site_type
        )
        user_website_data = {"username": user.username, "url": input_url}

        serializer = UserWebsiteSerializer(data=user_website_data)
        is_valid = serializer.is_valid(raise_exception=True)
        assert is_valid is True
        assert serializer.validated_data["url"] == exp_result_url

    def test_site_uniqueness(self, user):
        """
        Test that a user can only save one of a specific type of site
        """
        UserWebsiteFactory.create(
            profile=user.profile, url="facebook.com/1", site_type=FACEBOOK_DOMAIN
        )
        user_website_data = {"username": user.username, "url": "facebook.com/2"}
        serializer = UserWebsiteSerializer(data=user_website_data)
        with pytest.raises(  # noqa: PT012
            ValidationError, match="A website of this type has already been saved."
        ):
            serializer.is_valid(raise_exception=True)
            serializer.save()
