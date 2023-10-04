"""Factories for making test data"""

import factory
from factory.django import DjangoModelFactory

from articles import models


class ArticleFactory(DjangoModelFactory):
    """Factory for Articles"""

    html = factory.Faker("paragraph")
    title = factory.Faker("sentence", nb_words=4)

    class Meta:
        model = models.Article
