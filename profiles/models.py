"""Profile models"""

from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.db import models, transaction
from django.db.models import JSONField
from django_scim.models import AbstractSCIMUserMixin

from main.utils import frontend_absolute_url
from profiles.utils import (
    IMAGE_MEDIUM_MAX_DIMENSION,
    IMAGE_SMALL_MAX_DIMENSION,
    MAX_IMAGE_FIELD_LENGTH,
    make_thumbnail,
    profile_image_upload_uri,
    profile_image_upload_uri_medium,
    profile_image_upload_uri_small,
)

PROFILE_PROPS = (
    "name",
    "image",
    "image_small",
    "image_medium",
    "toc_optin",
    "headline",
    "bio",
)
FACEBOOK_DOMAIN = "facebook"
TWITTER_DOMAIN = "twitter"
LINKEDIN_DOMAIN = "linkedin"
PERSONAL_SITE_TYPE = "personal"
SITE_TYPE_OPTIONS = {
    FACEBOOK_DOMAIN,
    TWITTER_DOMAIN,
    LINKEDIN_DOMAIN,
    PERSONAL_SITE_TYPE,
}
SOCIAL_SITE_NAME_MAP = {
    FACEBOOK_DOMAIN: "Facebook",
    TWITTER_DOMAIN: "Twitter",
    LINKEDIN_DOMAIN: "LinkedIn",
}

User = get_user_model()


def certificate_id():
    return str(uuid4())


def filter_profile_props(data):
    """
    Filters the passed profile data to valid profile fields

    Args:
        data (dict): profile data

    Return:
        dict: filtered dict
    """  # noqa: D401
    return {key: value for key, value in data.items() if key in PROFILE_PROPS}


class Profile(AbstractSCIMUserMixin):
    """Profile model"""

    class Goal(models.TextChoices):
        """User goals choices"""

        ACADEMIC_EXCELLENCE = "academic-excellence", "Academic Excellence"
        CAREER_GROWTH = "career-growth", "Career Growth"
        LIFELONG_LEARNING = "lifelong-learning", "Lifelong Learning"

    class CertificateDesired(models.TextChoices):
        """User certificate desired choices"""

        YES = "yes", "Yes, I am looking for a certificate"
        NO = "no", "No, I am not looking for a certificate"
        NOT_SURE_YET = "not-sure-yet", "Not Sure"

    class CurrentEducation(models.TextChoices):
        """User current education choices"""

        NO_ANSWER = "", "----"
        DOCTORATE = "Doctorate", "Doctorate"
        MASTERS = "Master's or professional degree", "Master's or professional degree"
        BACHELORS = "Bachelor's degree", "Bachelor's degree"
        ASSOCIATES = "Associate degree", "Associate degree"
        SECONDARY = "Secondary/high school", "Secondary/high school"
        JUNIOR_SECONDARY = (
            "Junior secondary/junior high/middle school",
            "Junior secondary/junior high/middle school",
        )
        PRIMARY = "Elementary/primary school", "Elementary/primary school"
        NO_FORMAL = "No formal education", "No formal education"
        OTHER = "Other education", "Other education"

    class TimeCommitment(models.TextChoices):
        """User time commitment choices"""

        ZERO_TO_FIVE_HOURS = "0-to-5-hours", "<5 hours/week"
        FIVE_TO_TEN_HOURS = "5-to-10-hours", "5-10 hours/week"
        TEN_TO_TWENTY_HOURS = "10-to-20-hours", "10-20 hours/week"
        TWENTY_TO_THIRTY_HOURS = "20-to-30-hours", "20-30 hours/week"
        THIRTY_PLUS_HOURS = "30-plus-hours", "30+ hours/week"

    class LearningResourceFormat(models.TextChoices):
        """User learning format choices"""

        ONLINE = "online", "Online"
        HYBRID = "hybrid", "Hybrid"
        IN_PERSON = "in_person", "In-Person"

    class NotificationFrequency(models.TextChoices):
        """User notification frequency preferences"""

        NEVER = "never", "Never/Unsubscribe"
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    name = models.TextField(blank=True, null=True)  # noqa: DJ001

    image = models.CharField(  # noqa: DJ001
        null=True, max_length=MAX_IMAGE_FIELD_LENGTH
    )
    image_small = models.CharField(  # noqa: DJ001
        null=True, max_length=MAX_IMAGE_FIELD_LENGTH
    )
    image_medium = models.CharField(  # noqa: DJ001
        null=True, max_length=MAX_IMAGE_FIELD_LENGTH
    )

    image_file = models.ImageField(
        null=True, max_length=2083, upload_to=profile_image_upload_uri, editable=False
    )
    image_small_file = models.ImageField(
        null=True,
        max_length=2083,
        upload_to=profile_image_upload_uri_small,
        editable=False,
    )
    image_medium_file = models.ImageField(
        null=True,
        max_length=2083,
        upload_to=profile_image_upload_uri_medium,
        editable=False,
    )

    toc_optin = models.BooleanField(null=True)

    headline = models.CharField(blank=True, null=True, max_length=60)  # noqa: DJ001
    bio = models.TextField(blank=True, null=True)  # noqa: DJ001
    location = JSONField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    topic_interests = models.ManyToManyField(
        "learning_resources.LearningResourceTopic", limit_choices_to={"parent": None}
    )
    goals = ArrayField(
        models.CharField(max_length=50, choices=Goal.choices), default=list, blank=True
    )
    certificate_desired = models.CharField(
        max_length=50, choices=CertificateDesired.choices, blank=True, default=""
    )
    current_education = models.CharField(
        max_length=50, choices=CurrentEducation.choices, blank=True, default=""
    )
    time_commitment = models.CharField(
        max_length=50, choices=TimeCommitment.choices, blank=True, default=""
    )
    learning_format = ArrayField(
        models.CharField(max_length=50, choices=LearningResourceFormat.choices),
        default=list,
        blank=True,
    )
    notification_preference = models.CharField(
        max_length=50,
        choices=NotificationFrequency.choices,
        blank=True,
        default=NotificationFrequency.DAILY,
    )

    @transaction.atomic
    def save(self, *args, update_image=False, **kwargs):  # pylint: disable=arguments-differ
        """Update thumbnails if necessary"""
        if update_image:
            if self.image_file:
                small_thumbnail = make_thumbnail(
                    self.image_file, IMAGE_SMALL_MAX_DIMENSION
                )
                medium_thumbnail = make_thumbnail(
                    self.image_file, IMAGE_MEDIUM_MAX_DIMENSION
                )

                # name doesn't matter here, we use upload_to to produce that
                self.image_small_file.save(f"{uuid4().hex}.jpg", small_thumbnail)
                self.image_medium_file.save(f"{uuid4().hex}.jpg", medium_thumbnail)
            else:
                self.image_small_file = None
                self.image_medium_file = None
        super().save(*args, **kwargs)  # pylint:disable=super-with-arguments

    def __str__(self):
        return f"{self.name}"


class UserWebsite(models.Model):
    """A model for storing information for websites that should appear in a user's profile"""  # noqa: E501

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    url = models.CharField(max_length=200)
    site_type = models.CharField(
        max_length=15,
        choices=zip(sorted(SITE_TYPE_OPTIONS), sorted(SITE_TYPE_OPTIONS)),
        default=PERSONAL_SITE_TYPE,
    )

    class Meta:
        unique_together = ("profile", "site_type")

    def __str__(self):
        return f"url: {self.url}; site_type: {self.site_type}"


class ProgramCertificate(models.Model):
    """An external model that syncs with data from our data platform"""

    """
    NON-NULLABLE FIELDS
    """

    # external hash that hightouch uses for the sync
    record_hash = models.CharField(
        unique=True,
        primary_key=True,
        max_length=256,
        blank=False,
        default=certificate_id,
        null=False,
        editable=False,
    )
    program_title = models.CharField(max_length=256, blank=False)

    user_full_name = models.CharField(max_length=256, blank=True)

    user_email = models.CharField(max_length=256, blank=False)

    # NULLABLE FIELDS

    user_edxorg_id = models.IntegerField(null=True, blank=True)

    micromasters_program_id = models.IntegerField(null=True, blank=True)

    mitxonline_program_id = models.IntegerField(null=True, blank=True)

    user_edxorg_username = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_gender = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_address_city = models.CharField(  # noqa: DJ001
        null=True, max_length=256, blank=True
    )

    user_first_name = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_last_name = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_year_of_birth = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_country = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_address_postal_code = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_street_address = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    user_address_state_or_territory = models.CharField(  # noqa: DJ001
        null=True, max_length=256, blank=True
    )

    user_mitxonline_username = models.CharField(null=True, max_length=256, blank=True)  # noqa: DJ001

    program_completion_timestamp = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = '"external"."programcertificate"'

    def __str__(self):
        return f"program certificate: {self.user_full_name} - {self.program_title}"


class ProgramLetter(models.Model):
    """
    Class used to generate program letter views
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    certificate = models.ForeignKey(
        ProgramCertificate, on_delete=models.CASCADE, null=True
    )

    def __str__(self):
        return (
            "program letter: "
            f"{self.certificate.user_full_name} - {self.certificate.program_title}"
        )

    def get_absolute_url(self):
        return frontend_absolute_url(f"/program_letter/{self.id}/view")
