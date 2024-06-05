"""Profile forms"""

from django import forms

from profiles.models import Profile


class ProfileForm(forms.ModelForm):
    name = forms.CharField(required=False)
    goals = forms.MultipleChoiceField(choices=Profile.Goal.choices, required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["topic_interests"].required = False

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
            "topic_interests",
            "goals",
            "certificate_desired",
            "current_education",
            "time_commitment",
            "learning_format",
        ]
