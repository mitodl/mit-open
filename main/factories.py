"""
Factory for Users
"""

import ulid
from django.contrib.auth.models import Group, User
from factory import LazyFunction, RelatedFactory, SubFactory, Trait
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText
from social_django.models import UserSocialAuth


class UserFactory(DjangoModelFactory):
    """Factory for Users"""

    username = LazyFunction(lambda: ulid.new().str)
    email = FuzzyText(suffix="@example.com")
    first_name = FuzzyText()
    last_name = FuzzyText()

    profile = RelatedFactory("profiles.factories.ProfileFactory", "user")

    class Meta:
        model = User
        skip_postgeneration_save = True

    class Params:
        no_profile = Trait(profile=None)


class GroupFactory(DjangoModelFactory):
    """Factory for Groups"""

    name = FuzzyText()

    class Meta:
        model = Group


class UserSocialAuthFactory(DjangoModelFactory):
    """Factory for UserSocialAuth"""

    provider = FuzzyText()
    user = SubFactory(UserFactory)
    uid = FuzzyText()

    class Meta:
        model = UserSocialAuth
