"""Profile forms"""

from django import forms

from profiles.models import Profile


class ProfileForm(forms.ModelForm):
    name = forms.CharField(required=False)
    interests = forms.MultipleChoiceField(
        choices=Profile.Interest.choices, required=False
    )
    goals = forms.MultipleChoiceField(choices=Profile.Goal.choices, required=False)

    class Meta:
        model = Profile
        fields = [
            "user",
            "name",
            "headline",
            "bio",
            "location",
            "email_optin",
            "toc_optin",
            "interests",
            "goals",
            "certificate_desired",
            "current_education",
            "time_commitment",
            "course_format",
        ]
