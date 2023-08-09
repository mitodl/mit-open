"""Factories for making test data"""
import random
from datetime import timedelta
from enum import Enum

import factory
import pytz
from factory import Faker
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice

from learning_resources import models
from learning_resources.constants import AvailabilityType, LearningResourceType

# pylint:disable=unused-argument


class OfferedByChoice(Enum):
    """
    Enum for  Offered By labels to be used by factories
    """

    mitx = "MITx"
    ocw = "OCW"
    micromasters = "MicroMasters"
    bootcamps = "Bootcamps"
    xpro = "xPRO"
    oll = "Open Learning Library"
    csail = "CSAIL"
    mitpe = "Professional Education"
    see = "Sloan Executive Education"
    scc = "Schwarzman College of Computing"
    ctl = "Center for Transportation & Logistics"


class PlatformTypeChoice(Enum):
    """
    Enum for platform choices to be used by factories
    """

    ocw = "ocw"
    mitx = "mitx"
    mitxonline = "mitxonline"
    bootcamps = "bootcamps"
    xpro = "xpro"
    oll = "oll"


def _post_gen_prices(obj, create, extracted, **kwarg):
    """PostGeneration function for prices"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourcePriceFactory.create_batch(random.randint(1, 3))

    obj.prices.set(extracted)


def _post_gen_topics(obj, create, extracted, **kwargs):
    """PostGeneration function for topics"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourceTopicFactory.create_batch(random.randint(1, 5))

    obj.topics.set(extracted)


def _post_gen_tags(obj, create, extracted, **kwargs):
    """PostGeneration function for tags"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourceContentTagFactory.create_batch(random.randint(1, 5))

    obj.resource_content_tags.set(extracted)


def _post_gen_offered_by(obj, create, extracted, **kwargs):
    """PostGeneration function for offered_by"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourceOfferorFactory.create_batch(random.randint(1, 2))

    obj.offered_by.set(extracted)


class LearningResourceContentTagFactory(DjangoModelFactory):
    """Factory for LearningResourceContentTag objects"""

    name = factory.Sequence(lambda n: "Topic %03d" % n)

    class Meta:
        model = models.LearningResourceContentTag
        django_get_or_create = ("name",)


class LearningResourceInstructorFactory(DjangoModelFactory):
    """Factory for course instructors"""

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    full_name = factory.LazyAttribute(lambda ci: f"{ci.first_name} {ci.last_name}")

    class Meta:
        model = models.LearningResourceInstructor
        django_get_or_create = ("first_name", "last_name", "full_name")


class LearningResourceTopicFactory(DjangoModelFactory):
    """Factory for learning resource topics"""

    name = factory.Sequence(lambda n: "Topic %03d" % n)

    class Meta:
        model = models.LearningResourceTopic
        django_get_or_create = ("name",)


class LearningResourceImageFactory(DjangoModelFactory):
    """Factory for learning resource images"""

    description = factory.Faker("text")
    alt = factory.Faker("text")
    url = factory.Faker("url")

    class Meta:
        model = models.LearningResourceImage
        django_get_or_create = ("alt", "description", "url")


class LearningResourcePriceFactory(DjangoModelFactory):
    """Factory for course prices"""

    price = factory.Sequence(lambda n: 0.00 + float(n))
    mode = factory.Faker("word")
    upgrade_deadline = None

    class Meta:
        model = models.LearningResourcePrice
        django_get_or_create = ("price", "mode", "upgrade_deadline")


class LearningResourcePlatformFactory(DjangoModelFactory):
    """Factory for LearningResourcePlatform"""

    platform = FuzzyChoice([platform.value for platform in PlatformTypeChoice])
    is_edx = Faker("boolean")
    has_content_files = Faker("boolean")

    class Meta:
        model = models.LearningResourcePlatform
        django_get_or_create = ("platform",)


class LearningResourceOfferorFactory(DjangoModelFactory):
    """Factory for LearningResourceOfferor"""

    name = FuzzyChoice([offeror.value for offeror in OfferedByChoice])

    class Meta:
        model = models.LearningResourceOfferor
        django_get_or_create = ("name",)

    class Params:
        is_xpro = factory.Trait(name=OfferedByChoice.xpro.value)
        is_bootcamps = factory.Trait(name=OfferedByChoice.bootcamps.value)
        is_mitx = factory.Trait(name=OfferedByChoice.mitx.value)
        is_oll = factory.Trait(name=OfferedByChoice.oll.value)
        is_ocw = factory.Trait(name=OfferedByChoice.ocw.value)


class LearningResourceFactory(DjangoModelFactory):
    """Factory for LearningResource subclasses"""

    object_id = factory.Sequence(lambda n: "RESOURCEN%03d.MIT_run" % n)
    title = factory.Faker("word")
    description = factory.Faker("sentence")
    full_description = factory.Faker("text")
    url = factory.Faker("url")
    image = factory.SubFactory(LearningResourceImageFactory)
    platform = factory.SubFactory(LearningResourcePlatformFactory)
    offered_by = factory.PostGeneration(_post_gen_offered_by)
    topics = factory.PostGeneration(_post_gen_topics)
    resource_content_tags = factory.PostGeneration(_post_gen_tags)

    class Meta:
        model = models.LearningResource

    class Params:
        no_topics = factory.Trait(topics=[])


class CourseFactory(DjangoModelFactory):
    """Factory for Courses"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory, resource_type=LearningResourceType.course.value
    )
    extra_course_numbers = factory.List([])

    @factory.post_generation
    def runs(self, create, extracted, **kwargs):
        """Create run for program.learning_resource"""
        if not create:
            return

        if extracted is None:
            extracted = LearningResourceRunFactory.create_batch(
                2, learning_resource=self.learning_resource
            )

        self.runs.set(extracted)

    class Meta:
        model = models.Course


class LearningResourceRunFactory(DjangoModelFactory):
    """Factory for LearningResourceRuns"""

    learning_resource = factory.SubFactory(LearningResourceFactory)
    run_id = factory.Sequence(lambda n: "COURSEN%03d.MIT_run" % n)
    title = factory.Faker("word")
    description = factory.Faker("sentence")
    full_description = factory.Faker("text")
    url = factory.Faker("url")
    languages = [factory.Faker("word")]
    year = factory.Faker("year")
    image = factory.SubFactory(LearningResourceImageFactory)
    availability = FuzzyChoice(
        (
            AvailabilityType.current.value,
            AvailabilityType.upcoming.value,
            AvailabilityType.starting_soon.value,
            AvailabilityType.archived.value,
        )
    )
    enrollment_start = factory.Faker("date_time", tzinfo=pytz.utc)
    enrollment_end = factory.LazyAttribute(
        lambda obj: (obj.enrollment_start + timedelta(days=45))
        if obj.enrollment_start
        else None
    )
    start_date = factory.LazyAttribute(
        lambda obj: obj.enrollment_start + timedelta(days=15)
    )
    end_date = factory.LazyAttribute(
        lambda obj: obj.start_date + timedelta(days=90) if obj.start_date else None
    )
    prices = factory.PostGeneration(_post_gen_prices)

    @factory.post_generation
    def instructors(self, create, extracted, **kwargs):
        """Create instructors for course"""
        if not create:
            return

        if extracted is None:
            extracted = LearningResourceInstructorFactory.create_batch(
                random.randint(1, 3)
            )

        self.instructors.set(extracted)

    class Meta:
        model = models.LearningResourceRun

    class Params:
        no_prices = factory.Trait(prices=[])
        no_instructors = factory.Trait(instructors=[])

        in_past = factory.Trait(
            enrollment_start=factory.Faker(
                "date_time_between", end_date="-270d", tzinfo=pytz.utc
            )
        )
        in_future = factory.Trait(
            enrollment_start=factory.Faker(
                "date_time_between", start_date="+15d", tzinfo=pytz.utc
            )
        )


class ProgramFactory(DjangoModelFactory):
    """Factory for Programs"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory, resource_type=LearningResourceType.program.value
    )

    @factory.post_generation
    def runs(self, create, extracted, **kwargs):
        """Create run for program.learning_resource"""
        if not create:
            return

        if extracted is None:
            extracted = LearningResourceRunFactory.create(
                learning_resource=self.learning_resource
            )

        self.runs.set([extracted])

    @factory.post_generation
    def courses(self, create, extracted, **kwargs):
        """Create courses for program"""
        if not create:
            return

        if extracted is None:
            extracted = CourseFactory.create_batch(random.randint(1, 3))

        self.courses.set(extracted)

    class Meta:
        model = models.Program
