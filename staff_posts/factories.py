"""Factories for making test data"""

import factory
from factory.django import DjangoModelFactory

from staff_posts import models


class StaffPostFactory(DjangoModelFactory):
    """Factory for StaffPost"""

    html = factory.Faker("paragraph")
    title = factory.Faker("sentence", nb_words=4)

    class Meta:
        model = models.StaffPost
