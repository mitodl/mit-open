from factory.django import DjangoModelFactory

from learning_resources_search import models


class PercolateQueryFactory(DjangoModelFactory):
    class Meta:
        model = models.PercolateQuery
