"""Factories for channels"""

import factory
from factory.django import DjangoModelFactory

from channels.api import create_channel_groups_and_roles
from channels.constants import ChannelType
from channels.models import (
    Channel,
    ChannelDepartmentDetail,
    ChannelList,
    ChannelTopicDetail,
    ChannelUnitDetail,
    SubChannel,
)
from learning_resources.factories import (
    LearningPathFactory,
    LearningResourceDepartmentFactory,
    LearningResourceOfferorFactory,
    LearningResourceTopicFactory,
)


class ChannelFactory(DjangoModelFactory):
    """Factory for a channels.models.Channel object"""

    name = factory.fuzzy.FuzzyText(length=21)
    title = factory.Faker("text", max_nb_chars=50)
    published = True
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

    unit_detail = factory.Maybe(
        "create_unit_detail",
        yes_declaration=factory.RelatedFactory(
            "channels.factories.ChannelUnitDetailFactory",
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
        """Create the channel groups and roles after the channel is created"""
        if not create:
            return

        create_channel_groups_and_roles(self)

    class Meta:
        model = Channel
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
        is_unit = factory.Trait(channel_type=ChannelType.unit.name)
        create_unit_detail = factory.LazyAttribute(
            lambda c: c.channel_type == ChannelType.unit.name
        )
        is_pathway = factory.Trait(channel_type=ChannelType.pathway.name)
        create_pathway_detail = factory.LazyAttribute(
            lambda c: c.channel_type == ChannelType.pathway.name
        )


class ChannelTopicDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelTopicDetail object"""

    channel = factory.SubFactory(
        ChannelFactory, is_topic=True, create_topic_detail=False
    )
    topic = factory.SubFactory(LearningResourceTopicFactory)

    class Meta:
        model = ChannelTopicDetail

    class Params:
        is_unpublished = factory.Trait(channel__published=False)


class ChannelDepartmentDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelDepartmentDetail object"""

    channel = factory.SubFactory(
        ChannelFactory, is_department=True, create_department_detail=False
    )
    department = factory.SubFactory(LearningResourceDepartmentFactory)

    class Meta:
        model = ChannelDepartmentDetail

    class Params:
        is_unpublished = factory.Trait(channel__published=False)


class ChannelUnitDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelUnitDetail object"""

    channel = factory.SubFactory(ChannelFactory, is_unit=True, create_unit_detail=False)
    unit = factory.SubFactory(LearningResourceOfferorFactory)

    class Meta:
        model = ChannelUnitDetail

    class Params:
        is_unpublished = factory.Trait(channel__published=False)


class ChannelPathwayDetailFactory(DjangoModelFactory):
    """Factory for a channels.models.ChannelPathwayDetail object"""

    channel = factory.SubFactory(ChannelFactory, is_pathway=True)

    class Meta:
        model = ChannelUnitDetail


class SubChannelFactory(DjangoModelFactory):
    """Factory for channels.models.SubChannel object"""

    position = factory.Sequence(lambda n: n)
    parent_channel = factory.SubFactory(ChannelFactory)
    channel = factory.SubFactory(ChannelFactory)

    class Meta:
        model = SubChannel


class ChannelListFactory(DjangoModelFactory):
    """Factory for channels.models.ChannelList object"""

    learning_path = factory.SubFactory(LearningPathFactory)
    position = factory.Sequence(lambda n: n)
    channel_list = factory.LazyAttribute(lambda o: o.learning_path.learning_resource)
    channel = factory.SubFactory(ChannelFactory)

    class Meta:
        model = ChannelList
        exclude = ["learning_path"]
