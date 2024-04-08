from factory.django import DjangoModelFactory

from learning_resources_search import models


class PercolateQueryFactory(DjangoModelFactory):
    original_query = {"test": "test"}
    query = {"test": "test"}

    class Meta:
        model = models.PercolateQuery
