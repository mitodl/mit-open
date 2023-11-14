"""Factories for channels"""

import factory

from channels.api import create_field_groups_and_roles
from channels.models import FieldChannel, FieldList, Subfield
from learning_resources.factories import LearningPathFactory


class FieldChannelFactory(factory.DjangoModelFactory):
    """Factory for a channels.models.FieldChannel object"""

    name = factory.fuzzy.FuzzyText(length=21)
    title = factory.Faker("text", max_nb_chars=50)
    public_description = factory.Faker("text", max_nb_chars=50)

    about = factory.List(
        [
            factory.Dict({"node": "text", "value": factory.Faker("text")}),
            factory.Dict({"node": "text", "value": factory.Faker("text")}),
            factory.Dict({"node": "text", "value": factory.Faker("text")}),
        ]
    )

    @factory.post_generation
    def create_roles(
        self,
        create,
        extracted,  # noqa: ARG002
        **kwargs,  # noqa: ARG002
    ):  # pylint: disable=unused-argument
        """Create the field channel groups and roles after the field channel is created"""  # noqa: E501
        if not create:
            return

        create_field_groups_and_roles(self)

    class Meta:
        model = FieldChannel


class SubfieldFactory(factory.DjangoModelFactory):
    """Factory for channels.models.Subfield object"""

    position = factory.Sequence(lambda n: n)
    parent_channel = factory.SubFactory(FieldChannelFactory)
    field_channel = factory.SubFactory(FieldChannelFactory)

    class Meta:
        model = Subfield


class FieldListFactory(factory.DjangoModelFactory):
    """Factory for channels.models.FieldList object"""

    learning_path = factory.SubFactory(LearningPathFactory)
    position = factory.Sequence(lambda n: n)
    field_list = factory.LazyAttribute(lambda o: o.learning_path.learning_resource)
    field_channel = factory.SubFactory(FieldChannelFactory)

    class Meta:
        model = FieldList
        exclude = ["learning_path"]
