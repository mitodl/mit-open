"""Factories for channels"""

import factory
from factory.django import DjangoModelFactory

from channels.api import create_field_groups_and_roles
from channels.constants import ChannelType
from channels.models import (
    ChannelDepartmentDetail,
    ChannelOfferorDetail,
    ChannelTopicDetail,
    FieldChannel,
    FieldList,
    Subfield,
)
from learning_resources.factories import (
    LearningPathFactory,
    LearningResourceDepartmentFactory,
    LearningResourceOfferorFactory,
    LearningResourceTopicFactory,
)


class FieldChannelFactory(DjangoModelFactory):
    """Factory for a channels.models.FieldChannel object"""

    name = factory.fuzzy.FuzzyText(length=21)
    title = factory.Faker("text", max_nb_chars=50)
    public_description = factory.Faker("text", max_nb_chars=50)
    channel_type = factory.fuzzy.FuzzyChoice(ChannelType.names())

    about = factory.List(
        [
            factory.Dict({"node": "text", "value": factory.Faker("text")}),
            factory.Dict({"node": "text", "value": factory.Faker("text")}),
            factory.Dict({"node": "text", "value": factory.Faker("text")}),
        ]
    )

    topic_detail = factory.Maybe(
        "create_topic_detail",
        yes_declaration=factory.RelatedFactory(
            "channels.factories.ChannelTopicDetailFactory",
            factory_related_name="channel",
        ),
    )

    department_detail = factory.Maybe(
        "create_department_detail",
        yes_declaration=factory.RelatedFactory(
            "channels.factories.ChannelDepartmentDetailFactory",
            factory_related_name="channel",
        ),
    )

    offeror_detail = factory.Maybe(
        "create_offeror_detail",
        yes_declaration=factory.RelatedFactory(
            "channels.factories.ChannelOfferorDetailFactory",
            factory_related_name="channel",
        ),
    )

    pathway_detail = factory.Maybe(
        "create_pathway_detail",
        yes_declaration=factory.RelatedFactory(
            "channels.factories.ChannelPathwayDetailFactory",
            factory_related_name="channel",
        ),
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
        skip_postgeneration_save = True

    class Params:
        is_topic = factory.Trait(channel_type=ChannelType.topic.name)
        create_topic_detail = factory.LazyAttribute(
            lambda c: c.channel_type == ChannelType.topic.name
        )
        is_department = factory.Trait(channel_type=ChannelType.department.name)
        create_department_detail = factory.LazyAttribute(
            lambda c: c.channel_type == ChannelType.department.name
        )
        is_offeror = factory.Trait(channel_type=ChannelType.unit.name)
        create_offeror_detail = factory.LazyAttribute(
            lambda c: c.channel_type == ChannelType.unit.name
        )
        is_pathway = factory.Trait(channel_type=ChannelType.pathway.name)
        create_pathway_detail = factory.LazyAttribute(
            lambda c: c.channel_type == ChannelType.pathway.name
        )


class ChannelTopicDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelTopicDetail object"""

    channel = factory.SubFactory(
        FieldChannelFactory, is_topic=True, create_topic_detail=False
    )
    topic = factory.SubFactory(LearningResourceTopicFactory)

    class Meta:
        model = ChannelTopicDetail


class ChannelDepartmentDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelDepartmentDetail object"""

    channel = factory.SubFactory(
        FieldChannelFactory, is_department=True, create_department_detail=False
    )
    department = factory.SubFactory(LearningResourceDepartmentFactory)

    class Meta:
        model = ChannelDepartmentDetail


class ChannelOfferorDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelOfferorDetail object"""

    channel = factory.SubFactory(
        FieldChannelFactory, is_offeror=True, create_offeror_detail=False
    )
    offeror = factory.SubFactory(LearningResourceOfferorFactory)

    class Meta:
        model = ChannelOfferorDetail


class ChannelPathwayDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelPathwayDetail object"""

    channel = factory.SubFactory(FieldChannelFactory, is_pathway=True)

    class Meta:
        model = ChannelOfferorDetail


class SubfieldFactory(DjangoModelFactory):
    """Factory for channels.models.Subfield object"""

    position = factory.Sequence(lambda n: n)
    parent_channel = factory.SubFactory(FieldChannelFactory)
    field_channel = factory.SubFactory(FieldChannelFactory)

    class Meta:
        model = Subfield


class FieldListFactory(DjangoModelFactory):
    """Factory for channels.models.FieldList object"""

    learning_path = factory.SubFactory(LearningPathFactory)
    position = factory.Sequence(lambda n: n)
    field_list = factory.LazyAttribute(lambda o: o.learning_path.learning_resource)
    field_channel = factory.SubFactory(FieldChannelFactory)

    class Meta:
        model = FieldList
        exclude = ["learning_path"]
