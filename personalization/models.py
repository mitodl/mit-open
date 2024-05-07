"""Personalization models"""

from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.db import models

User = get_user_model()


class Personalization(models.Model):
    """
    User personalization selections
    """

    class Interest(models.TextChoices):
        """User interests choices"""

        COMPUTER_SCIENCE = "computer-science", "Computer Science"
        BUSINESS = "business", "Business"
        ENGINEERING = "engineering", "Engineering"
        LEADERSHIP = "leadership", "Leadership"
        ORGANIZED_BEHAVIOR = "organized-behavior", "Organized Behavior"
        MANAGEMENT = "management", "Management"
        ELECTRICAL_ENGINEERING = "electrical-engineering", "Electrical Engineering"
        INFORMATION_TECHNOLOGY = "information-technology", "Information Technology"
        BIOLOGY = "biology", "Biology"
        EARTH_SCIENCE = "earth-science", "Earth Science"
        ENVIRONMENTAL_ENGINEERING = (
            "environmental-engineering", "Environmental Engineering"
        )
        HEALTH_AND_MEDICINE = "health-and-medicine", "Health & Medicine"
        PROBABILITY_AND_STATS = "probability-and-stats", "Probability & Stats"
        ECONOMICS = "economics", "Economics"
        HISTORY = "history", "History"
        MATHEMATICS = "mathematics", "Mathematics"
        MECHANICAL_ENGINEERING = "mechanical-engineering", "Mechanical Engineering"
        OTHER = "other", "Other"

    class Goal(models.TextChoices):
        """User goals choices"""

        CAREER_GROWTH = "career-growth", "Career Growth"
        SUPPLEMENTAL_LEARNING = "supplemental-learning", "Supplemental Learning"
        JUST_TO_LEARN = "just-to-learn", "Just to Learn"

    class CertificateDesired(models.TextChoices):
        """User certificate desired choices"""

        YES = "yes", "Yes"
        NO = "no", "No"
        NOT_SURE_YET = "not-sure-yet", "Not Sure Yet"

    class CurrentEducation(models.TextChoices):
        """User current education choices"""

        NO_FORMAL = "no-formal", "No Formal Education"
        PRIMARY = "primary", "Primary Education"
        SECONDARY_OR_HIGH_SCHOOL = (
            "secondary-or-high-school", "Secondary Education or High School"
        )
        GED = "ged", "GED"
        VOCATIONAL_QUALIFICATION = (
            "vocational-qualification", "Vocational Qualification"
        )

    class TimeCommitment(models.TextChoices):
        """User time commitment choices"""

        ZERO_TO_FIVE_HOURS = "0-to-5-hours", "<5 hours/week"
        FIVE_TO_TEN_HOURS = "5-to-10-hours", "5-10 hours/week"
        TEN_TO_TWENTY_HOURS = "10-to-20-hours", "10-20 hours/week"
        TWENTY_TO_THIRTY_HOURS = "20-to-30-hours", "20-30 hours/week"
        THIRY_PLUS_HOURS = "30-plus-hours", "30+ hours/week"

    class CourseFormat(models.TextChoices):
        """User course format choices"""

        ONLINE = "online", "Online"
        IN_PERSON = "in-person", "In-Person"
        HYBRID = "hybrid", "Hybrid"

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    interests = ArrayField(
        models.CharField(max_length=50, choices=Interest.choices)
    )
    goals = ArrayField(
        models.CharField(max_length=50, choices=Goal.choices)
    )
    certificate_desired = models.CharField(max_length=50, choices=CertificateDesired.choices)
    current_education = models.CharField(max_length=50, choices=CurrentEducation.choices)
    time_commitment = models.CharField(max_length=50, choices=TimeCommitment.choices)
    course_format = models.CharField(max_length=50, choices=CourseFormat.choices)

    def __str__(self) -> str:
        """Return string representation"""
        return f"Personalizations for ${self.user.username}"
