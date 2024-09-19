"""Factories for making test data"""

import datetime
import decimal
import random
from datetime import UTC, timedelta

import factory
from factory import Faker
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice, FuzzyText

from learning_resources import constants, models
from learning_resources.constants import (
    DEPARTMENTS,
    Availability,
    LearningResourceDelivery,
    LevelType,
    PlatformType,
)
from learning_resources.etl.constants import CourseNumberType
from main.factories import UserFactory

# pylint:disable=unused-argument


def _post_gen_departments(obj, create, extracted, **kwargs):  # noqa: ARG001
    """PostGeneration function for departments"""
    if not create:
        return

    if extracted is None:
        extracted = LearningResourceDepartmentFactory.create_batch(1)
        obj.departments.set(extracted)


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

    obj.content_tags.set(extracted)


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


class LearningResourceTopicMappingFactory(DjangoModelFactory):
    """Factory for learning resource topic mappings"""

    offeror = factory.SubFactory(
        "learning_resources.factories.LearningResourceOfferorFactory"
    )
    topic = factory.SubFactory(
        "learning_resources.factories.LearningResourceTopicFactory"
    )
    topic_name = Faker("word")

    class Meta:
        model = models.LearningResourceTopicMapping
        django_get_or_create = ("offeror", "topic")


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

    code = FuzzyChoice([platform.name for platform in constants.PlatformType])
    name = factory.LazyAttribute(lambda o: constants.PlatformType[o.code].value)
    is_edx = Faker("boolean")
    has_content_files = Faker("boolean")

    class Meta:
        model = models.LearningResourcePlatform
        django_get_or_create = ("code",)


class LearningResourceSchoolFactory(DjangoModelFactory):
    """Factory for LearningResourceDepartment"""

    name = factory.Sequence(lambda n: "%03d name" % n)
    url = factory.Faker("url")

    class Meta:
        model = models.LearningResourceSchool


class LearningResourceDepartmentFactory(DjangoModelFactory):
    """Factory for LearningResourceDepartment"""

    department_id = factory.Sequence(lambda n: "%03d" % n)
    name = factory.Sequence(lambda n: "%03d name" % n)
    school = factory.SubFactory(
        "learning_resources.factories.LearningResourceSchoolFactory"
    )

    class Meta:
        model = models.LearningResourceDepartment
        django_get_or_create = ("department_id",)


class LearningResourceOfferorFactory(DjangoModelFactory):
    """Factory for LearningResourceOfferor"""

    code = FuzzyChoice([offeror.name for offeror in constants.OfferedBy])
    name = factory.LazyAttribute(lambda o: constants.OfferedBy[o.code].value)
    professional = factory.LazyAttribute(
        lambda o: o.code
        not in (constants.OfferedBy.mitx.name, constants.OfferedBy.ocw.name)
    )

    class Meta:
        model = models.LearningResourceOfferor
        django_get_or_create = ("code",)

    class Params:
        is_xpro = factory.Trait(
            code=constants.OfferedBy.xpro.name, name=constants.OfferedBy.xpro.value
        )
        is_bootcamps = factory.Trait(
            code=constants.OfferedBy.bootcamps.name,
            name=constants.OfferedBy.bootcamps.value,
        )
        is_mitx = factory.Trait(
            code=constants.OfferedBy.mitx.name, name=constants.OfferedBy.mitx.value
        )
        is_ocw = factory.Trait(
            code=constants.OfferedBy.ocw.name, name=constants.OfferedBy.ocw.value
        )
        is_see = factory.Trait(
            code=constants.OfferedBy.see.name, name=constants.OfferedBy.see.value
        )


class LearningResourceFactory(DjangoModelFactory):
    """Factory for LearningResource subclasses"""

    resource_type = factory.fuzzy.FuzzyChoice(
        choices=constants.LearningResourceType.names()
    )
    readable_id = factory.Sequence(
        lambda n: "RESOURCEN%03d_%03d.MIT" % (n, random.randint(1, 1000))  # noqa: S311
    )
    etl_source = "mock"
    title = factory.Faker("word")
    description = factory.Faker("sentence")
    full_description = factory.Faker("text")
    url = factory.Faker("url")
    languages = factory.List(random.choices(["en", "es"]))  # noqa: S311
    last_modified = factory.Faker("date_time", tzinfo=UTC)
    created_on = factory.Faker("date_time", tzinfo=UTC)
    image = factory.SubFactory(LearningResourceImageFactory)
    platform = factory.SubFactory(LearningResourcePlatformFactory)
    offered_by = factory.SubFactory(LearningResourceOfferorFactory)
    departments = factory.PostGeneration(_post_gen_departments)
    topics = factory.PostGeneration(_post_gen_topics)
    content_tags = factory.PostGeneration(_post_gen_tags)
    published = True
    delivery = factory.List(random.choices(LearningResourceDelivery.names()))  # noqa: S311
    professional = factory.LazyAttribute(
        lambda o: o.resource_type
        in (
            constants.LearningResourceType.course.name,
            constants.LearningResourceType.program.name,
        )
        and o.offered_by.professional
    )
    certification = factory.LazyAttribute(
        lambda o: (
            o.professional
            or (o.offered_by and o.offered_by.code == constants.OfferedBy.mitx.name)
        )
        is True
    )
    certification_type = factory.LazyAttribute(
        lambda o: constants.CertificationType.professional.name
        if o.professional
        else constants.CertificationType.completion.name
        if o.certification
        else constants.CertificationType.none.name
    )

    course = factory.Maybe(
        "create_course",
        yes_declaration=factory.RelatedFactory(
            "learning_resources.factories.CourseFactory",
            factory_related_name="learning_resource",
        ),
    )
    program = factory.Maybe(
        "create_program",
        yes_declaration=factory.RelatedFactory(
            "learning_resources.factories.ProgramFactory",
            factory_related_name="learning_resource",
        ),
    )
    learning_path = factory.Maybe(
        "create_learning_path",
        yes_declaration=factory.RelatedFactory(
            "learning_resources.factories.LearningPathFactory",
            factory_related_name="learning_resource",
        ),
    )
    podcast = factory.Maybe(
        "create_podcast",
        yes_declaration=factory.RelatedFactory(
            "learning_resources.factories.PodcastFactory",
            factory_related_name="learning_resource",
        ),
    )
    podcast_episode = factory.Maybe(
        "create_podcast_episode",
        yes_declaration=factory.RelatedFactory(
            "learning_resources.factories.PodcastEpisodeFactory",
            factory_related_name="learning_resource",
        ),
    )
    video = factory.Maybe(
        "create_video",
        yes_declaration=factory.RelatedFactory(
            "learning_resources.factories.VideoFactory",
            factory_related_name="learning_resource",
        ),
    )
    video_playlist = factory.Maybe(
        "create_video_playlist",
        yes_declaration=factory.RelatedFactory(
            "learning_resources.factories.VideoPlaylistFactory",
            factory_related_name="learning_resource",
        ),
    )
    runs = factory.Maybe(
        "create_runs",
        yes_declaration=factory.RelatedFactoryList(
            "learning_resources.factories.LearningResourceRunFactory",
            factory_related_name="learning_resource",
            size=2,
        ),
    )

    availability = FuzzyChoice(Availability.names())

    class Meta:
        model = models.LearningResource
        skip_postgeneration_save = True

    class Params:
        no_topics = factory.Trait(topics=[])
        no_content_tags = factory.Trait(content_tags=[])
        no_image = factory.Trait(image=None)

        is_course = factory.Trait(
            resource_type=constants.LearningResourceType.course.name
        )
        is_program = factory.Trait(
            resource_type=constants.LearningResourceType.program.name
        )
        is_learning_path = factory.Trait(
            resource_type=constants.LearningResourceType.learning_path.name
        )
        is_podcast = factory.Trait(
            resource_type=constants.LearningResourceType.podcast.name,
            platform=factory.SubFactory(
                LearningResourcePlatformFactory, code=PlatformType.podcast.name
            ),
        )
        is_podcast_episode = factory.Trait(
            resource_type=constants.LearningResourceType.podcast_episode.name,
            platform=factory.SubFactory(
                LearningResourcePlatformFactory, code=PlatformType.podcast.name
            ),
        )
        is_video = factory.Trait(
            resource_type=constants.LearningResourceType.video.name,
            platform=factory.SubFactory(
                LearningResourcePlatformFactory, code=PlatformType.youtube.name
            ),
        )
        is_video_playlist = factory.Trait(
            resource_type=constants.LearningResourceType.video_playlist.name,
            platform=factory.SubFactory(
                LearningResourcePlatformFactory, code=PlatformType.youtube.name
            ),
        )

        # these drive the RelatedFactory definitions, it's necessary to do it
        # this way because resource_type can be set by either a Trait or directly
        create_course = factory.LazyAttribute(
            lambda lr: lr.resource_type == constants.LearningResourceType.course.name
        )
        create_program = factory.LazyAttribute(
            lambda lr: lr.resource_type == constants.LearningResourceType.program.name
        )
        create_learning_path = factory.LazyAttribute(
            lambda lr: lr.resource_type
            == constants.LearningResourceType.learning_path.name
        )
        create_podcast = factory.LazyAttribute(
            lambda lr: lr.resource_type == constants.LearningResourceType.podcast.name
        )
        create_podcast_episode = factory.LazyAttribute(
            lambda lr: lr.resource_type
            == constants.LearningResourceType.podcast_episode.name
        )
        create_video = factory.LazyAttribute(
            lambda lr: lr.resource_type == constants.LearningResourceType.video.name
        )
        create_video_playlist = factory.LazyAttribute(
            lambda lr: lr.resource_type
            == constants.LearningResourceType.video_playlist.name
        )
        create_runs = factory.LazyAttribute(
            lambda lr: lr.resource_type
            in (
                constants.LearningResourceType.program.name,
                constants.LearningResourceType.course.name,
            )
        )


class LearningResourceViewEventFactory(DjangoModelFactory):
    """Factory for Learning Resource view events"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        is_course=True,
        create_course=False,
    )
    event_date = factory.Faker("date_time_this_year", tzinfo=datetime.UTC)

    class Meta:
        """Meta options for the factory"""

        model = models.LearningResourceViewEvent


class CourseFactory(DjangoModelFactory):
    """Factory for Courses"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        is_course=True,
        create_course=False,
    )
    course_numbers = factory.List(
        [
            {
                "value": f"{random.randint(1,20)}.0001",  # noqa: S311
                "department": None,
                "listing_type": CourseNumberType.primary.name,
                "primary": True,
                "sort_coursenum": f"{random.randint(1, 20):02d}",  # noqa: S311
            }
        ]
    )

    @factory.post_generation
    def platform(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create platform for course.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.platform = LearningResourcePlatformFactory.create(
            code=extracted, name=constants.PlatformType[extracted].value
        )
        self.learning_resource.save()

    @factory.post_generation
    def offered_by(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create LearningResourceOfferor for course.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.offered_by = LearningResourceOfferorFactory.create(
            code=extracted, name=constants.OfferedBy[extracted].value
        )
        self.learning_resource.save()

    @factory.post_generation
    def etl_source(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create etl_source for course.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.etl_source = extracted
        self.learning_resource.save()

    @factory.post_generation
    def department(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create LearningResourceDepartment for course.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.departments.set(
            [
                LearningResourceDepartmentFactory.create(
                    department_id=extracted,
                    name=DEPARTMENTS[extracted],
                )
            ]
        )
        self.learning_resource.save()

    class Meta:
        model = models.Course
        skip_postgeneration_save = True

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)
        is_professional = factory.Trait(learning_resource__professional=True)
        has_certification = factory.Trait(learning_resource__certification=True)


class LearningResourceRunFactory(DjangoModelFactory):
    """Factory for LearningResourceRuns"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        resource_type=factory.fuzzy.FuzzyChoice(
            choices=[
                constants.LearningResourceType.course.name,
                constants.LearningResourceType.program.name,
            ]
        ),
    )
    run_id = factory.Sequence(lambda n: "RUN%03d.MIT_run" % n)
    title = factory.Faker("word")
    description = factory.Faker("sentence")
    full_description = factory.Faker("text")
    url = factory.Faker("url")
    level = factory.List(random.choices(LevelType.names()))  # noqa: S311
    languages = factory.List(random.choices(["en", "es"]))  # noqa: S311
    year = factory.Faker("year")
    image = factory.SubFactory(LearningResourceImageFactory)
    availability = FuzzyChoice(Availability.names())
    enrollment_start = factory.Faker("future_datetime", tzinfo=UTC)
    enrollment_end = factory.LazyAttribute(
        lambda obj: (
            (obj.enrollment_start + timedelta(days=45))
            if obj.enrollment_start
            else None
        )
    )
    start_date = factory.LazyAttribute(
        lambda obj: obj.enrollment_start + timedelta(days=15)
    )
    end_date = factory.LazyAttribute(
        lambda obj: obj.start_date + timedelta(days=90) if obj.start_date else None
    )
    prices = sorted(
        [
            decimal.Decimal(random.uniform(100, 200))  # noqa: S311
            for _ in range(random.randint(1, 3))  # noqa: S311
        ]
    )

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
        skip_postgeneration_save = True

    class Params:
        no_prices = factory.Trait(prices=[])
        no_instructors = factory.Trait(instructors=[])

        is_unpublished = factory.Trait(learning_resource__published=False)

        in_past = factory.Trait(
            enrollment_start=factory.Faker(
                "date_time_between", end_date="-270d", tzinfo=UTC
            )
        )
        in_future = factory.Trait(
            enrollment_start=factory.Faker(
                "date_time_between", start_date="+15d", tzinfo=UTC
            )
        )


class LearningPathFactory(DjangoModelFactory):
    """Factory for LearningPath"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        is_learning_path=True,
        create_learning_path=False,
        platform=None,
        offered_by=None,
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
                "relation_type": (
                    constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
                )
            },
        )

    class Meta:
        model = models.LearningPath
        skip_postgeneration_save = True

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)


class ProgramFactory(DjangoModelFactory):
    """Factory for Programs"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        is_program=True,
        create_program=False,
    )

    @factory.post_generation
    def platform(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create platform for course.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.platform = LearningResourcePlatformFactory.create(
            code=extracted, name=constants.PlatformType[extracted].value
        )
        self.learning_resource.save()

    @factory.post_generation
    def offered_by(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create LearningResourceOfferor for course.learning_resource"""
        if not create or not extracted:
            return

        self.learning_resource.offered_by = LearningResourceOfferorFactory.create(
            code=extracted, name=constants.OfferedBy[extracted].value
        )
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
                "relation_type": (
                    constants.LearningResourceRelationTypes.PROGRAM_COURSES.value
                )
            },
        )

    class Meta:
        model = models.Program
        skip_postgeneration_save = True

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)
        is_professional = factory.Trait(learning_resource__professional=True)


class LearningPathRelationshipFactory(DjangoModelFactory):
    """Factory for LearningPathRelationship objects"""

    parent = factory.SubFactory(
        LearningResourceFactory,
        is_learning_path=True,
    )

    child = factory.SubFactory(LearningResourceFactory)

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
    content_type = FuzzyChoice(
        (constants.CONTENT_TYPE_FILE, constants.CONTENT_TYPE_PAGE)
    )
    file_type = FuzzyChoice(("application/pdf", "video/mp4", "text"))
    published = True
    content_tags = factory.PostGeneration(_post_gen_tags)

    class Meta:
        model = models.ContentFile


class UserListFactory(DjangoModelFactory):
    """Factory for Learning Paths"""

    title = FuzzyText()
    description = FuzzyText()
    author = factory.SubFactory(UserFactory)

    @factory.post_generation
    def topics(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create topics for learning path"""
        if not create:
            return

        if extracted:
            for topic in extracted:
                self.topics.add(topic)

    class Meta:
        model = models.UserList


class UserListRelationshipFactory(DjangoModelFactory):
    """Factory for UserListRelationship objects"""

    parent = factory.SubFactory(UserListFactory)

    child = factory.SubFactory(LearningResourceFactory, is_course=True)

    position = factory.Sequence(lambda n: n)

    class Meta:
        model = models.UserListRelationship
        skip_postgeneration_save = True


class PodcastEpisodeFactory(DjangoModelFactory):
    """Factory for Podcast Episode"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        platform=factory.SubFactory(
            LearningResourcePlatformFactory, code=PlatformType.podcast.name
        ),
        is_podcast_episode=True,
        create_podcast_episode=False,
    )

    transcript = factory.Faker("text")
    episode_link = factory.Faker("url")
    rss = factory.Faker("text")

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)

    class Meta:
        model = models.PodcastEpisode
        skip_postgeneration_save = True


class PodcastFactory(DjangoModelFactory):
    """Factory for Podcast"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        platform=factory.SubFactory(
            LearningResourcePlatformFactory, code=PlatformType.podcast.name
        ),
        is_podcast=True,
        create_podcast=False,
    )
    apple_podcasts_url = factory.Faker("uri")
    google_podcasts_url = factory.Faker("uri")
    rss_url = factory.Faker("uri")

    @factory.post_generation
    def episodes(self, create, extracted, **kwargs):  # noqa: ARG002
        """Create courses for program"""
        if not create:
            return

        if extracted is None:
            extracted = [
                episode.learning_resource
                for episode in PodcastEpisodeFactory.create_batch(
                    random.randint(1, 3)  # noqa: S311
                )
            ]

        self.learning_resource.resources.set(
            extracted,
            through_defaults={
                "relation_type": (
                    constants.LearningResourceRelationTypes.PODCAST_EPISODES.value
                )
            },
        )

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)

    class Meta:
        model = models.Podcast
        skip_postgeneration_save = True


class VideoFactory(DjangoModelFactory):
    """Factory for Videos"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        platform=factory.SubFactory(
            LearningResourcePlatformFactory, code=PlatformType.youtube.name
        ),
        is_video=True,
        create_video=False,
    )
    duration = factory.Sequence(lambda n: "PT%02dM%02dS" % (n, n))

    class Meta:
        model = models.Video
        skip_postgeneration_save = True

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)


class VideoChannelFactory(DjangoModelFactory):
    """Factory for VideoChannels"""

    channel_id = factory.Sequence(lambda n: "VIDEO-CHANNEL-%03d.MIT" % n)
    title = factory.Faker("word")

    class Params:
        is_unpublished = factory.Trait(published=False)

    class Meta:
        model = models.VideoChannel
        skip_postgeneration_save = True


class VideoPlaylistFactory(DjangoModelFactory):
    """Factory for Video Playlists"""

    learning_resource = factory.SubFactory(
        LearningResourceFactory,
        is_video_playlist=True,
        create_video_playlist=False,
    )

    channel = factory.SubFactory("learning_resources.factories.VideoChannelFactory")

    class Params:
        is_unpublished = factory.Trait(learning_resource__published=False)

    class Meta:
        model = models.VideoPlaylist
        skip_postgeneration_save = True
