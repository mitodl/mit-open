"""Tests for ETL loaders"""

import json

# pylint: disable=redefined-outer-name,too-many-locals,too-many-lines
from types import SimpleNamespace

import pytest
from django.forms.models import model_to_dict

from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
    PlatformType,
)
from learning_resources.etl.constants import (
    CourseLoaderConfig,
    ETLSource,
    ProgramLoaderConfig,
)
from learning_resources.etl.loaders import (
    load_content_file,
    load_content_files,
    load_course,
    load_courses,
    load_instructors,
    load_offered_by,
    load_podcast,
    load_podcast_episode,
    load_podcasts,
    load_program,
    load_programs,
    load_run,
    load_topics,
)
from learning_resources.etl.xpro import _parse_datetime
from learning_resources.factories import (
    ContentFileFactory,
    CourseFactory,
    LearningResourceFactory,
    LearningResourceInstructorFactory,
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
    LearningResourceRunFactory,
    LearningResourceTopicFactory,
    PodcastEpisodeFactory,
    PodcastFactory,
    ProgramFactory,
)
from learning_resources.models import (
    ContentFile,
    Course,
    LearningResource,
    LearningResourceOfferor,
    LearningResourceRun,
    PodcastEpisode,
    Program,
)
from open_discussions.utils import now_in_utc

pytestmark = pytest.mark.django_db

non_transformable_attributes = (
    "id",
    "platform",
    "departments",
    "content_tags",
    "resources",
)


@pytest.fixture(autouse=True)
def mock_blocklist(mocker):
    """Mock the load_course_blocklist function"""
    return mocker.patch(
        "learning_resources.etl.loaders.load_course_blocklist", return_value=[]
    )


@pytest.fixture(autouse=True)
def mock_duplicates(mocker):
    """Mock the load_course_duplicates function"""
    return mocker.patch(
        "learning_resources.etl.loaders.load_course_duplicates", return_value=[]
    )


@pytest.fixture(autouse=True)
def mock_upsert_tasks(mocker):
    """Mock out the upsert task helpers"""
    return SimpleNamespace(
        upsert_learning_resource=mocker.patch(
            "learning_resources_search.tasks.upsert_learning_resource",
        ),
        deindex_learning_resource=mocker.patch(
            "learning_resources_search.tasks.deindex_document"
        ),
    )


@pytest.fixture()
def learning_resource_offeror():
    """Return a LearningResourceOfferer"""
    return LearningResourceOfferorFactory.create()


@pytest.mark.parametrize("program_exists", [True, False])
@pytest.mark.parametrize("is_published", [True, False])
@pytest.mark.parametrize("courses_exist", [True, False])
@pytest.mark.parametrize("has_retired_course", [True, False])
def test_load_program(
    mock_upsert_tasks,
    program_exists,
    is_published,
    courses_exist,
    has_retired_course,
):  # pylint: disable=too-many-arguments
    """Test that load_program loads the program"""
    platform = LearningResourcePlatformFactory.create()

    program = (
        ProgramFactory.create(courses=[], platform=platform.code)
        if program_exists
        else ProgramFactory.build(courses=[], platform=platform.code)
    )

    LearningResourcePlatformFactory.create(code=platform.code)

    if program_exists:
        learning_resource = program.learning_resource
        learning_resource.is_published = is_published
        learning_resource.platform = platform
        learning_resource.runs.set([])
        learning_resource.save()

    courses = (
        CourseFactory.create_batch(2, platform=platform.code)
        if courses_exist
        else CourseFactory.build_batch(2, platform=platform.code)
    )

    before_course_count = len(courses) if courses_exist else 0
    after_course_count = len(courses)

    if program_exists and has_retired_course:
        course = CourseFactory.create(platform=platform.code)
        before_course_count += 1
        after_course_count += 1
        program.learning_resource.resources.set(
            [course.learning_resource],
            through_defaults={
                "relation_type": LearningResourceRelationTypes.PROGRAM_COURSES.value
            },
        )
        assert program.learning_resource.children.count() == 1

    assert Program.objects.count() == (1 if program_exists else 0)
    assert Course.objects.count() == before_course_count

    run_data = {
        "run_id": program.learning_resource.readable_id,
        "enrollment_start": "2017-01-01T00:00:00Z",
        "start_date": "2017-01-20T00:00:00Z",
        "end_date": "2017-06-20T00:00:00Z",
    }

    result = load_program(
        {
            "platform": platform.code,
            "readable_id": program.learning_resource.readable_id,
            "professional": False,
            "title": program.learning_resource.title,
            "url": program.learning_resource.url,
            "image": {"url": program.learning_resource.image.url},
            "published": is_published,
            "runs": [run_data],
            "courses": [
                {
                    "readable_id": course.learning_resource.readable_id,
                    "platform": platform.code,
                }
                for course in courses
            ],
        },
        [],
        [],
    )

    if program_exists and not is_published:
        mock_upsert_tasks.deindex_learning_resource.assert_called_with(
            result.id, result.resource_type
        )
    elif is_published:
        mock_upsert_tasks.upsert_learning_resource.assert_called_with(result.id)
    else:
        mock_upsert_tasks.upsert_learning_resource.assert_not_called()

    assert Program.objects.count() == 1
    assert Course.objects.count() == after_course_count

    # assert we got a program back and that each course is in a program
    assert isinstance(result, LearningResource)
    assert result.professional is False
    assert result.children.count() == len(courses)
    assert result.program.courses.count() == len(courses)
    assert result.runs.filter(published=True).count() == 1

    assert result.runs.filter(published=True).first().start_date == _parse_datetime(
        run_data["start_date"]
    )

    for relationship, data in zip(
        sorted(
            result.program.learning_resource.children.all(),
            key=lambda item: item.child.readable_id,
        ),
        sorted(courses, key=lambda course: course.learning_resource.readable_id),
    ):
        assert isinstance(relationship.child, LearningResource)
        assert relationship.child.readable_id == data.learning_resource.readable_id


def test_load_program_bad_platform(mocker):
    """A bad platform should log an exception and not create the program"""
    mock_log = mocker.patch("learning_resources.etl.loaders.log.exception")
    bad_platform = "bad_platform"
    props = {
        "readable_id": "abc123",
        "platform": bad_platform,
        "professional": False,
        "title": "program title",
        "image": {"url": "https://www.test.edu/image.jpg"},
        "description": "description",
        "url": "https://test.edu",
        "published": True,
        "courses": [],
    }
    result = load_program(props, [], [], config=ProgramLoaderConfig(prune=True))
    assert result is None
    mock_log.assert_called_once_with(
        "Platform %s is null or not in database: %s", bad_platform, json.dumps(props)
    )


@pytest.mark.parametrize("course_exists", [True, False])
@pytest.mark.parametrize("is_published", [True, False])
@pytest.mark.parametrize("is_run_published", [True, False])
@pytest.mark.parametrize("blocklisted", [True, False])
def test_load_course(  # noqa: PLR0913
    mocker,
    mock_upsert_tasks,
    course_exists,
    is_published,
    is_run_published,
    blocklisted,
):
    """Test that load_course loads the course"""
    platform = LearningResourcePlatformFactory.create()

    course = (
        CourseFactory.create(learning_resource__runs=[], platform=platform.code)
        if course_exists
        else CourseFactory.build(learning_resource__runs=[], platform=platform.code)
    )

    learning_resource = course.learning_resource

    learning_resource.published = is_published

    if course_exists:
        run = LearningResourceRunFactory.create(
            learning_resource=learning_resource, published=True
        )
        learning_resource.runs.set([run])
        learning_resource.save()
    else:
        run = LearningResourceRunFactory.build()
    assert Course.objects.count() == (1 if course_exists else 0)

    props = {
        "readable_id": learning_resource.readable_id,
        "platform": platform.code,
        "professional": True,
        "title": learning_resource.title,
        "image": {"url": learning_resource.image.url},
        "description": learning_resource.description,
        "url": learning_resource.url,
        "published": is_published,
    }

    if is_run_published:
        run = {
            "run_id": run.run_id,
            "enrollment_start": run.enrollment_start,
            "start_date": run.start_date,
            "end_date": run.end_date,
        }
        props["runs"] = [run]
    else:
        props["runs"] = []

    blocklist = [learning_resource.readable_id] if blocklisted else []

    result = load_course(props, blocklist, [], config=CourseLoaderConfig(prune=True))
    assert result.professional is True

    if course_exists and ((not is_published or not is_run_published) or blocklisted):
        mock_upsert_tasks.deindex_learning_resource.assert_called_with(
            result.id, result.resource_type
        )
    elif is_published and is_run_published and not blocklisted:
        mock_upsert_tasks.upsert_learning_resource.assert_called_with(result.id)
    else:
        mock_upsert_tasks.deindex_learning_resource.assert_not_called()
        mock_upsert_tasks.upsert_learning_resource.assert_not_called()

    if course_exists and is_published and not blocklisted:
        course.refresh_from_db()
        assert course.learning_resource.runs.last().published is is_run_published
        assert course.learning_resource.published == (is_published and is_run_published)

    assert Course.objects.count() == 1
    assert LearningResourceRun.objects.filter(published=True).count() == (
        1 if is_run_published else 0
    )

    # assert we got a course back
    assert isinstance(result, LearningResource)

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"


def test_load_course_bad_platform(mocker):
    """A bad platform should log an exception and not create the course"""
    mock_log = mocker.patch("learning_resources.etl.loaders.log.exception")
    bad_platform = "bad_platform"
    props = {
        "readable_id": "abc123",
        "platform": bad_platform,
        "etl_source": ETLSource.ocw.name,
        "title": "course title",
        "image": {"url": "https://www.test.edu/image.jpg"},
        "description": "description",
        "url": "https://test.edu",
        "published": True,
        "runs": [
            {
                "run_id": "test_run_id",
                "enrollment_start": now_in_utc(),
                "start_date": now_in_utc(),
                "end_date": now_in_utc(),
            }
        ],
    }
    result = load_course(props, [], [], config=CourseLoaderConfig(prune=True))
    assert result is None
    mock_log.assert_called_once_with(
        "Platform %s is null or not in database: %s", bad_platform, '"abc123"'
    )


@pytest.mark.parametrize("course_exists", [True, False])
@pytest.mark.parametrize("course_id_is_duplicate", [True, False])
@pytest.mark.parametrize("duplicate_course_exists", [True, False])
def test_load_duplicate_course(
    mock_upsert_tasks,
    course_exists,
    course_id_is_duplicate,
    duplicate_course_exists,
):
    """Test that load_course loads the course"""
    platform = LearningResourcePlatformFactory.create()

    course = (
        CourseFactory.create(learning_resource__runs=[], platform=platform.code)
        if course_exists
        else CourseFactory.build()
    )

    duplicate_course = (
        CourseFactory.create(learning_resource__runs=[], platform=platform.code)
        if duplicate_course_exists
        else CourseFactory.build()
    )

    if course_exists and duplicate_course_exists:
        assert Course.objects.count() == 2
    elif course_exists or duplicate_course_exists:
        assert Course.objects.count() == 1
    else:
        assert Course.objects.count() == 0

    duplicates = [
        {
            "course_id": course.learning_resource.readable_id,
            "duplicate_course_ids": [
                course.learning_resource.readable_id,
                duplicate_course.learning_resource.readable_id,
            ],
        }
    ]

    course_id = (
        duplicate_course.learning_resource.readable_id
        if course_id_is_duplicate
        else course.learning_resource.readable_id
    )

    props = {
        "readable_id": course_id,
        "platform": platform.code,
        "title": "New title",
        "description": "something",
        "runs": [
            {
                "run_id": course.learning_resource.readable_id,
                "enrollment_start": "2017-01-01T00:00:00Z",
                "start_date": "2017-01-20T00:00:00Z",
                "end_date": "2017-06-20T00:00:00Z",
            }
        ],
    }

    result = load_course(props, [], duplicates)

    if course_id_is_duplicate and duplicate_course_exists:
        mock_upsert_tasks.deindex_learning_resource.assert_called()

    mock_upsert_tasks.upsert_learning_resource.assert_called_with(result.id)

    assert Course.objects.count() == (2 if duplicate_course_exists else 1)

    assert isinstance(result, LearningResource)

    saved_course = LearningResource.objects.filter(
        readable_id=course.learning_resource.readable_id
    ).first()

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"
        assert (
            getattr(saved_course, key) == value
        ), f"Property {key} should be updated to {value} in the database"


@pytest.mark.parametrize("run_exists", [True, False])
def test_load_run(run_exists):
    """Test that load_run loads the course run"""
    course = CourseFactory.create(learning_resource__runs=[])
    learning_resource_run = (
        LearningResourceRunFactory.create(learning_resource=course.learning_resource)
        if run_exists
        else LearningResourceRunFactory.build()
    )
    props = model_to_dict(
        LearningResourceRunFactory.build(run_id=learning_resource_run.run_id)
    )

    del props["id"]
    del props["learning_resource"]

    assert LearningResourceRun.objects.count() == (1 if run_exists else 0)

    result = load_run(course.learning_resource, props)

    assert LearningResourceRun.objects.count() == 1

    assert result.learning_resource == course.learning_resource

    assert isinstance(result, LearningResourceRun)

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"


@pytest.mark.parametrize("parent_factory", [CourseFactory, ProgramFactory])
@pytest.mark.parametrize("topics_exist", [True, False])
def test_load_topics(parent_factory, topics_exist):
    """Test that load_topics creates and/or assigns topics to the parent object"""
    topics = (
        LearningResourceTopicFactory.create_batch(3)
        if topics_exist
        else LearningResourceTopicFactory.build_batch(3)
    )
    parent = parent_factory.create()

    load_topics(parent.learning_resource, [])

    assert parent.learning_resource.topics.count() == 0

    load_topics(parent.learning_resource, [{"name": topic.name} for topic in topics])

    assert parent.learning_resource.topics.count() == len(topics)

    load_topics(parent.learning_resource, None)

    assert parent.learning_resource.topics.count() == len(topics)

    load_topics(parent.learning_resource, [])

    assert parent.learning_resource.topics.count() == 0


@pytest.mark.parametrize("instructor_exists", [True, False])
def test_load_instructors(instructor_exists):
    """Test that load_instructors creates and/or assigns instructors to the course run"""
    instructors = (
        LearningResourceInstructorFactory.create_batch(3)
        if instructor_exists
        else LearningResourceInstructorFactory.build_batch(3)
    )
    run = LearningResourceRunFactory.create(no_instructors=True)

    assert run.instructors.count() == 0

    load_instructors(
        run, [{"full_name": instructor.full_name} for instructor in instructors]
    )

    assert run.instructors.count() == len(instructors)


@pytest.mark.parametrize("parent_factory", [CourseFactory, ProgramFactory])
@pytest.mark.parametrize("offeror_exists", [True, False])
@pytest.mark.parametrize("has_other_offered_by", [True, False])
@pytest.mark.parametrize("null_data", [True, False])
def test_load_offered_bys(
    parent_factory, offeror_exists, has_other_offered_by, null_data
):
    """Test that load_offered_bys creates and/or assigns offeror to the parent object"""
    resource = parent_factory.create().learning_resource
    LearningResourceOfferor.objects.all().delete()

    ocw_offeror = (
        LearningResourceOfferorFactory.create(is_ocw=True) if offeror_exists else None
    )
    mitx_offeror = LearningResourceOfferorFactory.create(is_mitx=True)

    resource.offered_by = mitx_offeror if has_other_offered_by else None
    resource.save()

    expected = None
    if offeror_exists and not null_data:
        expected = ocw_offeror

    load_offered_by(resource, None if null_data else {"name": "OCW"})

    assert resource.offered_by == expected


@pytest.mark.parametrize("prune", [True, False])
def test_load_courses(mocker, mock_blocklist, mock_duplicates, prune):
    """Test that load_courses calls the expected functions"""

    course_to_unpublish = CourseFactory.create(etl_source=ETLSource.xpro.name)
    courses = CourseFactory.create_batch(3, etl_source=ETLSource.xpro.name)

    courses_data = [
        {"readable_id": course.learning_resource.readable_id} for course in courses
    ]

    mock_load_course = mocker.patch(
        "learning_resources.etl.loaders.load_course",
        autospec=True,
        side_effect=[course.learning_resource for course in courses],
    )
    config = CourseLoaderConfig(prune=prune)
    load_courses(ETLSource.xpro.name, courses_data, config=config)
    assert mock_load_course.call_count == len(courses)
    for course_data in courses_data:
        mock_load_course.assert_any_call(
            course_data,
            mock_blocklist.return_value,
            mock_duplicates.return_value,
            config=config,
        )
    mock_blocklist.assert_called_once_with()
    mock_duplicates.assert_called_once_with(ETLSource.xpro.name)
    course_to_unpublish.refresh_from_db()
    assert course_to_unpublish.learning_resource.published is not prune


def test_load_programs(mocker, mock_blocklist, mock_duplicates):
    """Test that load_programs calls the expected functions"""
    program_data = [{"courses": [{"platform": "a"}, {}]}]
    mock_load_program = mocker.patch(
        "learning_resources.etl.loaders.load_program", autospec=True
    )
    load_programs("mitx", program_data)
    assert mock_load_program.call_count == len(program_data)
    mock_blocklist.assert_called_once()
    mock_duplicates.assert_called_once_with("mitx")


@pytest.mark.parametrize("is_published", [True, False])
def test_load_content_files(mocker, is_published):
    """Test that load_content_files calls the expected functions"""
    course = CourseFactory.create()
    course_run = LearningResourceRunFactory.create(
        published=is_published, learning_resource=course.learning_resource
    )

    returned_content_file_id = 1

    content_data = [{"a": "b"}, {"a": "c"}]
    mock_load_content_file = mocker.patch(
        "learning_resources.etl.loaders.load_content_file",
        return_value=returned_content_file_id,
        autospec=True,
    )
    mock_bulk_index = mocker.patch(
        "learning_resources.etl.loaders.resource_run_upserted_actions",
    )
    mock_bulk_delete = mocker.patch(
        "learning_resources.etl.loaders.resource_run_unpublished_actions",
        autospec=True,
    )
    load_content_files(course_run, content_data)
    assert mock_load_content_file.call_count == len(content_data)
    assert mock_bulk_index.call_count == (1 if is_published else 0)
    assert mock_bulk_delete.call_count == (0 if is_published else 1)


def test_load_content_file():
    """Test that load_content_file saves a ContentFile object"""
    learning_resource_run = LearningResourceRunFactory.create()

    props = model_to_dict(ContentFileFactory.build(run_id=learning_resource_run.id))
    props.pop("run")
    props.pop("id")

    result = load_content_file(learning_resource_run, props)

    assert ContentFile.objects.count() == 1

    # assert we got an integer back
    assert isinstance(result, int)

    loaded_file = ContentFile.objects.get(pk=result)
    assert loaded_file.run == learning_resource_run

    for key, value in props.items():
        assert (
            getattr(loaded_file, key) == value
        ), f"Property {key} should equal {value}"


def test_load_content_file_error(mocker):
    """Test that an exception in load_content_file is logged"""
    learning_resource_run = LearningResourceRunFactory.create()
    mock_log = mocker.patch("learning_resources.etl.loaders.log.exception")
    load_content_file(learning_resource_run, {"uid": "badfile", "bad": "data"})
    mock_log.assert_called_once_with(
        "ERROR syncing course file %s for run %d", "badfile", learning_resource_run.id
    )


def test_load_podcasts(learning_resource_offeror, podcast_platform):
    """Test load_podcasts"""

    podcasts_data = []
    for podcast in PodcastFactory.build_batch(3):
        episodes = PodcastEpisodeFactory.build_batch(3)
        podcast_data = model_to_dict(
            podcast.learning_resource, exclude=non_transformable_attributes
        )
        podcast_data["image"] = {"url": podcast.learning_resource.image.url}
        podcast_data["offered_by"] = {"name": learning_resource_offeror.name}
        episodes_data = [
            {
                **model_to_dict(
                    episode.learning_resource, exclude=non_transformable_attributes
                ),
                "offered_by": {"name": learning_resource_offeror.name},
            }
            for episode in episodes
        ]
        podcast_data["episodes"] = episodes_data
        podcasts_data.append(podcast_data)
    results = load_podcasts(podcasts_data)

    assert len(results) == len(podcasts_data)

    for result in results:
        assert isinstance(result, LearningResource)
        assert result.resource_type == LearningResourceType.podcast.name
        assert result.platform.code == PlatformType.podcast.name
        assert result.children.count() > 0
        for relation in result.children.all():
            assert (
                relation.child.resource_type
                == LearningResourceType.podcast_episode.name
            )
            assert (
                relation.relation_type
                == LearningResourceRelationTypes.PODCAST_EPISODES.value
            )


def test_load_podcasts_unpublish(podcast_platform):
    """Test load_podcast when a podcast gets unpublished"""
    podcast = PodcastFactory.create().learning_resource
    assert podcast.published is True
    assert podcast.children.count() > 0
    for relation in podcast.children.all():
        assert relation.child.published is True

    load_podcasts([])

    podcast.refresh_from_db()

    assert podcast.published is False
    assert podcast.children.count() > 0
    for relation in podcast.children.all():
        assert relation.child.published is False


@pytest.mark.parametrize("podcast_episode_exists", [True, False])
@pytest.mark.parametrize("is_published", [True, False])
def test_load_podcast_episode(
    mock_upsert_tasks,
    learning_resource_offeror,
    podcast_platform,
    podcast_episode_exists,
    is_published,
):
    """Test that load_podcast_episode loads the podcast episode"""
    podcast_episode = (
        LearningResourceFactory.create(published=is_published, is_podcast_episode=True)
        if podcast_episode_exists
        else LearningResourceFactory.build(
            published=is_published, is_podcast_episode=True
        )
    )

    props = model_to_dict(podcast_episode, exclude=non_transformable_attributes)
    props["image"] = {"url": podcast_episode.image.url}
    props["offered_by"] = {"name": learning_resource_offeror.name}
    topics = (
        podcast_episode.topics.all()
        if podcast_episode_exists
        else LearningResourceTopicFactory.build_batch(2)
    )
    props["topics"] = [model_to_dict(topic, exclude=["id"]) for topic in topics]

    result = load_podcast_episode(props)

    assert PodcastEpisode.objects.count() == 1

    # assert we got a podcast episode back
    assert isinstance(result, LearningResource)
    assert result.resource_type == LearningResourceType.podcast_episode.name
    assert result.podcast_episode is not None

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"

    if podcast_episode_exists and not is_published:
        mock_upsert_tasks.deindex_learning_resource.assert_called_with(
            result.id, result.resource_type
        )
    elif is_published:
        mock_upsert_tasks.upsert_learning_resource.assert_called_with(result.id)
    else:
        mock_upsert_tasks.upsert_learning_resource.assert_not_called()
        mock_upsert_tasks.deindex_learning_resource.assert_not_called()


@pytest.mark.parametrize("podcast_exists", [True, False])
@pytest.mark.parametrize("is_published", [True, False])
def test_load_podcast(
    mock_upsert_tasks,
    learning_resource_offeror,
    podcast_platform,
    podcast_exists,
    is_published,
):
    """Test that load_podcast loads the podcast"""
    podcast = (
        PodcastFactory.create(episodes=[], is_unpublished=not is_published)
        if podcast_exists
        else PodcastFactory.build(episodes=[], is_unpublished=not is_published)
    ).learning_resource
    existing_podcast_episode = (
        PodcastEpisodeFactory.create(is_unpublished=not is_published).learning_resource
        if podcast_exists
        else None
    )
    if existing_podcast_episode:
        podcast.resources.set(
            [existing_podcast_episode],
            through_defaults={
                "relation_type": LearningResourceRelationTypes.PODCAST_EPISODES.value
            },
        )
        assert podcast.resources.count() == 1

    podcast_data = model_to_dict(podcast, exclude=non_transformable_attributes)
    podcast_data["title"] = "New Title"
    podcast_data["image"] = {"url": podcast.image.url}
    podcast_data["offered_by"] = {"name": learning_resource_offeror.name}
    topics = (
        podcast.topics.all()
        if podcast_exists
        else LearningResourceTopicFactory.build_batch(2)
    )
    podcast_data["topics"] = [model_to_dict(topic) for topic in topics]

    episode = PodcastEpisodeFactory.build().learning_resource
    episode_data = model_to_dict(episode, exclude=non_transformable_attributes)
    episode_data["image"] = {"url": episode.image.url}
    episode_data["offered_by"] = {"name": learning_resource_offeror.name}

    podcast_data["episodes"] = [episode_data]
    result = load_podcast(podcast_data)

    new_podcast = LearningResource.objects.get(readable_id=podcast.readable_id)
    new_podcast_episode = new_podcast.resources.order_by("-created_on").first()

    assert new_podcast.title == "New Title"

    if is_published:
        assert new_podcast_episode.published is True

    if podcast_exists and is_published:
        assert new_podcast.id == podcast.id
        assert new_podcast.resources.count() == 2
    elif podcast_exists or is_published:
        assert new_podcast.resources.count() == 1
    else:
        assert new_podcast.resources.count() == 0

    if podcast_exists and not is_published:
        mock_upsert_tasks.deindex_learning_resource.assert_called_with(
            result.id, result.resource_type
        )
    elif is_published:
        mock_upsert_tasks.upsert_learning_resource.assert_called_with(result.id)
    else:
        mock_upsert_tasks.deindex_learning_resource.assert_not_called()
        mock_upsert_tasks.upsert_learning_resource.assert_not_called()
