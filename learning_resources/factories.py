"""Factories for making test data"""
import decimal
import random
from datetime import timedelta

import factory
import pytz
from factory import Faker
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice, FuzzyInteger

from learning_resources import constants, models
from open_discussions.factories import UserFactory

# pylint:disable=unused-argument


def _post_gen_topics(obj, create, extracted, **kwargs):  # noqa: ARG001
    """PostGeneration function for topics"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourceTopicFactory.create_batch(
            random.randint(1, 5)  # noqa: S311
        )

    obj.topics.set(extracted)


def _post_gen_tags(obj, create, extracted, **kwargs):  # noqa: ARG001
    """PostGeneration function for tags"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourceContentTagFactory.create_batch(
            random.randint(1, 5)  # noqa: S311
        )

    obj.resource_content_tags.set(extracted)


def _post_gen_offered_by(obj, create, extracted, **kwargs):  # noqa: ARG001
    """PostGeneration function for offered_by"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourceOfferorFactory.create_batch(
            random.randint(1, 2)  # noqa: S311
        )

    obj.offered_by.set(extracted)


class LearningResourceContentTagFactory(DjangoModelFactory):
    """Factory for LearningResourceContentTag objects"""

    name = factory.Sequence(lambda n: "Tag %03d" % n)

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


class LearningResourcePlatformFactory(DjangoModelFactory):
    """Factory for LearningResourcePlatform"""

    platform = FuzzyChoice([platform.value for platform in constants.PlatformType])
    audience = FuzzyChoice([constants.OPEN, constants.PROFESSIONAL])
    is_edx = Faker("boolean")
    has_content_files = Faker("boolean")

    class Meta:
        model = models.LearningResourcePlatform
        django_get_or_create = ("platform",)


class LearningResourceDepartmentFactory(DjangoModelFactory):
    """Factory for LearningResourcePlatform"""

    department_id = FuzzyInteger(1, 20)
    name = Faker("word")

    class Meta:
        model = models.LearningResourceDepartment
        django_get_or_create = ("department_id",)


class LearningResourceOfferorFactory(DjangoModelFactory):
    """Factory for LearningResourceOfferor"""

    name = FuzzyChoice([offeror.value for offeror in constants.OfferedBy])

    class Meta:
        model = models.LearningResourceOfferor
        django_get_or_create = ("name",)

    class Params:
        is_xpro = factory.Trait(name=constants.OfferedBy.xpro.value)
        is_bootcamps = factory.Trait(name=constants.OfferedBy.bootcamps.value)
        is_mitx = factory.Trait(name=constants.OfferedBy.mitx.value)
        is_oll = factory.Trait(name=constants.OfferedBy.oll.value)
        is_ocw = factory.Trait(name=constants.OfferedBy.ocw.value)


class LearningResourceFactory(DjangoModelFactory):
    """Factory for LearningResource subclasses"""

    readable_id = factory.Sequence(
        lambda n: "RESOURCEN%03d_%03d.MIT_run"
        % (n, random.randint(1, 1000))  # noqa: S311
    )
    title = factory.Faker("word")
    description = factory.Faker("sentence")
    full_description = factory.Faker("text")
    url = factory.Faker("url")
    languages = factory.List(random.choices(["en", "es"]))  # noqa: S311
    last_modified = factory.Faker("date_time", tzinfo=pytz.utc)
    image = factory.SubFactory(LearningResourceImageFactory)
    platform = factory.SubFactory(LearningResourcePlatformFactory)
    department = factory.SubFactory(LearningResourceDepartmentFactory)
    offered_by = factory.PostGeneration(_post_gen_offered_by)
    topics = factory.PostGeneration(_post_gen_topics)
    resource_content_tags = factory.PostGeneration(_post_gen_tags)

    class Meta:
        model = models.LearningResource

    class Params:
        no_topics = factory.Trait(topics=[])
        is_course = factory.Trait(
            resource_type=constants.LearningResourceType.course.value
        )
        is_program = factory.Trait(
            resource_type=constants.LearningResourceType.program.value
        )


class CourseFactory(DjangoModelFactory):
    """Factory for Courses"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        resource_type=constants.LearningResourceType.course.value,
    )
    extra_course_numbers = factory.List([])

    @factory.post_generation
    def runs(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create run for program.learning_resource"""
        if not create:
            return

        if extracted is None:
            extracted = LearningResourceRunFactory.create_batch(
                2, learning_resource=self.learning_resource
            )

        self.runs.set(extracted)

    @factory.post_generation
    def platform(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create platform for course.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.platform = LearningResourcePlatformFactory.create(
            platform=extracted
        )
        self.learning_resource.save()

    class Meta:
        model = models.Course

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)


class LearningResourceRunFactory(DjangoModelFactory):
    """Factory for LearningResourceRuns"""

    learning_resource = factory.SubFactory(LearningResourceFactory)
    run_id = factory.Sequence(lambda n: "RUN%03d.MIT_run" % n)
    title = factory.Faker("word")
    description = factory.Faker("sentence")
    full_description = factory.Faker("text")
    url = factory.Faker("url")
    level = FuzzyChoice(("Undergraduate", "Graduate"))
    languages = factory.List(random.choices(["en", "es"]))  # noqa: S311
    year = factory.Faker("year")
    image = factory.SubFactory(LearningResourceImageFactory)
    availability = FuzzyChoice(
        (
            constants.AvailabilityType.current.value,
            constants.AvailabilityType.upcoming.value,
            constants.AvailabilityType.starting_soon.value,
            constants.AvailabilityType.archived.value,
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
    prices = [
        decimal.Decimal(random.uniform(100, 200))  # noqa: S311
        for _ in range(random.randint(1, 3))  # noqa: S311
    ]

    @factory.post_generation
    def instructors(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create instructors for course"""
        if not create:
            return

        if extracted is None:
            extracted = LearningResourceInstructorFactory.create_batch(
                random.randint(1, 3)  # noqa: S311
            )

        self.instructors.set(extracted)

    class Meta:
        model = models.LearningResourceRun

    class Params:
        no_prices = factory.Trait(prices=[])
        no_instructors = factory.Trait(instructors=[])

        is_unpublished = factory.Trait(learning_resource__published=False)

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


class LearningPathFactory(DjangoModelFactory):
    """Factory for LearningPath"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        resource_type=constants.LearningResourceType.learning_path.value,
    )
    author = factory.SubFactory(UserFactory)

    @factory.post_generation
    def resources(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create resources for LearningPath"""
        if not create:
            return

        if extracted is None:
            extracted = [
                ProgramFactory.create().learning_resource,
                *[
                    course.learning_resource
                    for course in CourseFactory.create_batch(
                        random.randint(1, 3)  # noqa: S311
                    )
                ],
            ]

        self.learning_resource.resources.set(
            extracted,
            through_defaults={
                "relation_type": constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value  # noqa: E501
            },
        )

    class Meta:
        model = models.LearningPath

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)


class ProgramFactory(DjangoModelFactory):
    """Factory for Programs"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        resource_type=constants.LearningResourceType.program.value,
    )

    @factory.post_generation
    def runs(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create run for program.learning_resource"""
        if not create:
            return

        if extracted is None:
            extracted = LearningResourceRunFactory.create(
                learning_resource=self.learning_resource,
                run_id=f"{self.learning_resource.resource_type}_{self.learning_resource.readable_id}.MIT_run",
            )

        self.runs.set([extracted])

    @factory.post_generation
    def platform(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create platform for program.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.platform = extracted
        self.learning_resource.save()

    @factory.post_generation
    def courses(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create courses for program"""
        if not create:
            return

        if extracted is None:
            extracted = [
                course.learning_resource
                for course in CourseFactory.create_batch(
                    random.randint(1, 3)  # noqa: S311
                )
            ]

        self.learning_resource.resources.set(
            extracted,
            through_defaults={
                "relation_type": constants.LearningResourceRelationTypes.PROGRAM_COURSES.value  # noqa: E501
            },
        )

    class Meta:
        model = models.Program

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)


class LearningPathItemFactory(DjangoModelFactory):
    """Factory for LearningPath items"""

    parent = factory.SubFactory(
        LearningResourceFactory,
        resource_type=constants.LearningResourceType.learning_path.value,
    )

    child = factory.SubFactory(
        LearningResourceFactory,
        resource_type=constants.LearningResourceType.course.value,
        course=factory.SubFactory(CourseFactory),
    )

    position = factory.Sequence(lambda n: n)
    relation_type = constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value

    class Meta:
        model = models.LearningResourceRelationship

    class Params:
        is_program = factory.Trait(child=factory.SubFactory(ProgramFactory))


class ContentFileFactory(DjangoModelFactory):
    """Factory for ContentFiles"""

    run = factory.SubFactory(LearningResourceRunFactory)
    key = factory.Faker("file_path")
    title = factory.Faker("sentence")
    description = factory.Faker("sentence")
    uid = factory.Faker("text", max_nb_chars=32)
    url = factory.Faker("url")
    image_src = FuzzyChoice(("https://img.youtube.com/thumb.jpg", None))
    short_url = factory.Faker("word")
    content_type = FuzzyChoice(
        (constants.CONTENT_TYPE_FILE, constants.CONTENT_TYPE_PAGE)
    )
    file_type = FuzzyChoice(("application/pdf", "video/mp4", "text"))
    published = True

    class Meta:
        model = models.ContentFile
