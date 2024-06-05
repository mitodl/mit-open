"""
Serializers for profile REST APIs
"""

import re

import ulid
from django.contrib.auth import get_user_model
from django.db import transaction
from django.urls import reverse
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from authentication import api as auth_api
from learning_resources.models import LearningResourceTopic
from learning_resources.permissions import is_admin_user, is_learning_path_editor
from learning_resources.serializers import LearningResourceTopicSerializer
from profiles.api import get_site_type_from_url
from profiles.models import (
    PERSONAL_SITE_TYPE,
    PROFILE_PROPS,
    SOCIAL_SITE_NAME_MAP,
    Profile,
    ProgramCertificate,
    ProgramLetter,
    UserWebsite,
)
from profiles.utils import (
    IMAGE_MEDIUM,
    IMAGE_SMALL,
    fetch_program_letter_template_data,
    image_uri,
)

User = get_user_model()


class TopicInterestsField(serializers.Field):
    """
    Serializer field for topic interests
    """

    def to_representation(self, value):
        """Serialize the topic_interests"""
        return LearningResourceTopicSerializer(value, many=True).data

    def to_internal_value(self, data):
        """Validate the topic_interests"""
        topic_ids = data

        if not topic_ids:
            return []

        if not isinstance(topic_ids, list) or not all(
            isinstance(topic_id, int) for topic_id in topic_ids
        ):
            msg = "Should be a list of topic integer ids"
            raise serializers.ValidationError(msg)

        topics = LearningResourceTopic.objects.filter(parent=None, id__in=topic_ids)

        valid_ids = {topic.id for topic in topics}
        missing_ids = set(topic_ids) - valid_ids

        if missing_ids:
            missing = ",".join(map(str, missing_ids))
            message = f"Invalid id(s): {missing}"
            raise serializers.ValidationError(message)

        return topics


class PreferencesSearchSerializer(serializers.Serializer):
    """Serializer for profile search preference filters"""

    certification = serializers.BooleanField(required=False)
    topics = serializers.ListField(child=serializers.CharField(), required=False)
    learning_format = serializers.CharField(required=False)


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile"""

    email_optin = serializers.BooleanField(write_only=True, required=False)
    toc_optin = serializers.BooleanField(write_only=True, required=False)
    username = serializers.SerializerMethodField(read_only=True)
    profile_image_medium = serializers.SerializerMethodField(read_only=True)
    profile_image_small = serializers.SerializerMethodField(read_only=True)
    placename = serializers.SerializerMethodField(read_only=True)
    topic_interests = TopicInterestsField(default=list)
    preference_search_filters = serializers.SerializerMethodField()

    def get_username(self, obj) -> str:
        """Custom getter for the username"""  # noqa: D401
        return str(obj.user.username)

    def get_profile_image_medium(self, obj) -> str:
        """Custom getter for medium profile image"""  # noqa: D401
        return image_uri(obj, IMAGE_MEDIUM)

    def get_profile_image_small(self, obj) -> str:
        """Custom getter for small profile image"""  # noqa: D401
        return image_uri(obj, IMAGE_SMALL)

    def get_placename(self, obj) -> str:
        """Custom getter for location text"""  # noqa: D401
        if obj.location:
            return obj.location.get("value", "")
        return ""

    @extend_schema_field(PreferencesSearchSerializer)
    def get_preference_search_filters(self, obj) -> dict:
        """Get search filters based on profile preferences."""
        filters = {}
        if (
            obj.certificate_desired
            and obj.certificate_desired != Profile.CertificateDesired.NOT_SURE_YET.value
        ):
            filters["certification"] = (
                obj.certificate_desired == Profile.CertificateDesired.YES.value
            )
        if obj.topic_interests and obj.topic_interests.count() > 0:
            filters["topics"] = obj.topic_interests.values_list("name", flat=True)
        if obj.learning_format:
            filters["learning_format"] = obj.learning_format
        return PreferencesSearchSerializer(instance=filters).data

    def validate_location(self, location):
        """
        Validator for location.
        """  # noqa: D401
        if location and (not isinstance(location, dict) or ("value" not in location)):
            msg = "Missing/incorrect location information"
            raise ValidationError(msg)
        return location

    def update(self, instance, validated_data):
        """Update the profile and related docs in OpenSearch"""
        with transaction.atomic():
            topic_interests = validated_data.pop("topic_interests", None)

            if topic_interests is not None:
                instance.topic_interests.set(topic_interests)

            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            update_image = "image_file" in validated_data
            instance.save(update_image=update_image)
            return instance

    def to_representation(self, instance):
        """
        Overridden serialization method. Adds serialized UserWebsites if an option in the context indicates that
        it should be included.
        """  # noqa: E501
        data = super().to_representation(instance)
        if self.context.get("include_user_websites"):
            data["user_websites"] = UserWebsiteSerializer(
                instance.userwebsite_set.all(), many=True
            ).data
        return data

    class Meta:
        model = Profile
        fields = (
            "name",
            "image",
            "image_small",
            "image_medium",
            "image_file",
            "image_small_file",
            "image_medium_file",
            "profile_image_small",
            "profile_image_medium",
            "email_optin",
            "toc_optin",
            "bio",
            "headline",
            "username",
            "placename",
            "location",
            "topic_interests",
            "goals",
            "current_education",
            "certificate_desired",
            "time_commitment",
            "learning_format",
            "preference_search_filters",
        )
        read_only_fields = (
            "image_file_small",
            "image_file_medium",
            "profile_image_small",
            "profile_image_medium",
            "username",
            "placename",
            "preference_search_filters",
        )
        extra_kwargs = {"location": {"write_only": True}}


class UserWebsiteSerializer(serializers.ModelSerializer):
    """Serializer for UserWebsite"""

    def validate_url(self, value):
        """
        Validator for url. Prepends http protocol to the url if the protocol wasn't already included in the value.
        """  # noqa: D401, E501
        url = "" if not value else value.lower()
        if not re.search(r"^http[s]?://", url):
            return "{}{}".format("http://", url)
        return url

    def to_internal_value(self, data):
        """
        Overridden deserialization method. Changes the default behavior in the following ways:
        1) Gets the profile id from a given username.
        2) Calculates the site_type from the url value and adds it to the internal value.
        """  # noqa: E501
        internal_value = super().to_internal_value(
            {
                **data,
                "profile": (
                    Profile.objects.filter(user__username=data.get("username"))
                    .values_list("id", flat=True)
                    .first()
                ),
            }
        )
        internal_value["site_type"] = get_site_type_from_url(
            internal_value.get("url", "")
        )
        return internal_value

    def run_validators(self, value):
        """
        Overridden validation method. Changes the default behavior in the following ways:
        1) If the user submitted a URL to save as a specific site type (personal/social),
            ensure that the URL entered matches that submitted site type.
        2) If the data provided violates the uniqueness of the site type for the given user, coerce
            the error to a "url" field validation error instead of a non-field error.
        """  # noqa: E501
        submitted_site_type = self.initial_data.get("submitted_site_type")
        calculated_site_type = value.get("site_type")
        if submitted_site_type and calculated_site_type:
            # The URL is for a personal site, but was submitted as a social site
            if (
                calculated_site_type == PERSONAL_SITE_TYPE
                and submitted_site_type != calculated_site_type
            ):
                msg = "Please provide a URL for one of these social sites: {}".format(
                    ", ".join(SOCIAL_SITE_NAME_MAP.values())
                )
                raise ValidationError({"url": [msg]})
            # The URL is for a social site, but was submitted as a personal site
            elif (
                calculated_site_type in SOCIAL_SITE_NAME_MAP
                and submitted_site_type == PERSONAL_SITE_TYPE
            ):
                raise ValidationError(
                    {
                        "url": [
                            "A social site URL was provided. Please provide a URL for a personal website."  # noqa: E501
                        ]
                    }
                )
        try:
            return super().run_validators(value)
        except ValidationError as e:
            if e.get_codes() == ["unique"]:
                raise ValidationError(  # noqa: B904, TRY200
                    {"url": ["A website of this type has already been saved."]},
                    code="unique",
                )

    def to_representation(self, instance):
        """
        Overridden serialization method. Excludes 'profile' from the serialized data as it isn't relevant as a
        serialized field (we only need to deserialize that value).
        """  # noqa: E501
        data = super().to_representation(instance)
        data.pop("profile")
        return data

    class Meta:
        model = UserWebsite
        fields = ("id", "profile", "url", "site_type")
        read_only_fields = ("id", "site_type")


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User"""

    # username cannot be set but a default is generated on create using ulid.new
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    email = serializers.CharField(write_only=True)
    is_learning_path_editor = serializers.SerializerMethodField()
    is_article_editor = serializers.SerializerMethodField()
    profile = ProfileSerializer()

    def get_is_learning_path_editor(self, instance) -> bool:  # noqa: ARG002
        request = self.context.get("request")
        if request:
            return is_admin_user(request) or is_learning_path_editor(request)
        return False

    def get_is_article_editor(self, instance) -> bool:  # noqa: ARG002
        request = self.context.get("request")
        if request:
            return is_admin_user(request)
        return False

    def create(self, validated_data):
        profile_data = validated_data.pop("profile") or {}
        username = ulid.new()
        email = validated_data.get("email")

        with transaction.atomic():
            return auth_api.create_user(username, email, profile_data)

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        email = validated_data.get("email", None)

        with transaction.atomic():
            if email:
                instance.email = email
                instance.save()

            if profile_data:
                profile = instance.profile
                for prop_name in PROFILE_PROPS:
                    setattr(
                        profile,
                        prop_name,
                        profile_data.get(prop_name, getattr(profile, prop_name)),
                    )
                profile.save()
        return instance

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "profile",
            "email",
            "first_name",
            "last_name",
            "is_article_editor",
            "is_learning_path_editor",
        )
        read_only_fields = ("id", "username")


class ProgramCertificateSerializer(serializers.ModelSerializer):
    """
    Serializer for Program Certificates
    """

    program_letter_generate_url = serializers.SerializerMethodField()
    program_letter_share_url = serializers.SerializerMethodField()

    def get_program_letter_generate_url(self, instance) -> str:
        request = self.context.get("request")
        letter_url = reverse(
            "profile:program-letter-intercept",
            kwargs={"program_id": instance.micromasters_program_id},
        )
        if request:
            return request.build_absolute_uri(letter_url)
        return letter_url

    def get_program_letter_share_url(self, instance) -> str:
        request = self.context.get("request")

        user = User.objects.get(email=instance.user_email)
        letter, created = ProgramLetter.objects.get_or_create(
            user=user, certificate=instance
        )
        letter_url = letter.get_absolute_url()
        if request:
            return request.build_absolute_uri(letter_url)
        return letter_url

    class Meta:
        model = ProgramCertificate
        fields = "__all__"


class ProgramLetterTemplateFieldSerializer(serializers.Serializer):
    """
    Seriializer for program letter template data which is configured in
    micromasters
    """

    id = serializers.IntegerField()
    meta = serializers.JSONField()
    title = serializers.CharField()
    program_id = serializers.IntegerField()
    program_letter_footer = serializers.JSONField()
    program_letter_footer_text = serializers.CharField()
    program_letter_header_text = serializers.CharField()
    program_letter_text = serializers.CharField()
    program_letter_logo = serializers.JSONField()
    program_letter_signatories = serializers.ListField(child=serializers.JSONField())


class ProgramLetterSerializer(serializers.ModelSerializer):
    """
    Serializer for Program Letters
    """

    id = serializers.UUIDField(read_only=True)

    template_fields = serializers.SerializerMethodField()

    certificate = ProgramCertificateSerializer()

    @extend_schema_field(ProgramLetterTemplateFieldSerializer())
    def get_template_fields(self, instance) -> dict:
        """Get template fields from the micromasters cms api"""
        return ProgramLetterTemplateFieldSerializer(
            fetch_program_letter_template_data(instance)
        ).data

    class Meta:
        model = ProgramLetter
        fields = ["id", "template_fields", "certificate"]
