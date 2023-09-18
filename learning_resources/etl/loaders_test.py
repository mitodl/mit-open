"""Tests for ETL loaders"""
# pylint: disable=redefined-outer-name,too-many-locals,too-many-lines
from types import SimpleNamespace

import pytest
from django.forms.models import model_to_dict

from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
    PlatformType,
)
from learning_resources.etl.loaders import (
    load_podcast,
    load_podcast_episode,
    load_podcasts,
)
from learning_resources.factories import (
    LearningResourceOfferorFactory,
    LearningResourceTopicFactory,
    PodcastEpisodeFactory,
    PodcastFactory,
)
from learning_resources.models import (
    LearningResource,
    PodcastEpisode,
)

pytestmark = pytest.mark.django_db

non_transformable_attributes = (
    "id",
    "platform",
    "department",
    "resource_content_tags",
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
        upsert_course=mocker.patch("search.search_index_helpers.upsert_course"),
        delete_course=mocker.patch("search.search_index_helpers.deindex_course"),
        upsert_program=mocker.patch("search.search_index_helpers.upsert_program"),
        delete_program=mocker.patch("search.search_index_helpers.deindex_program"),
        upsert_video=mocker.patch("search.search_index_helpers.upsert_video"),
        delete_video=mocker.patch("search.search_index_helpers.deindex_video"),
        delete_user_list=mocker.patch("search.search_index_helpers.deindex_user_list"),
        upsert_user_list=mocker.patch("search.search_index_helpers.upsert_user_list"),
        upsert_podcast=mocker.patch("search.search_index_helpers.upsert_podcast"),
        upsert_podcast_episode=mocker.patch(
            "search.search_index_helpers.upsert_podcast_episode"
        ),
        delete_podcast=mocker.patch("search.search_index_helpers.deindex_podcast"),
        delete_podcast_episode=mocker.patch(
            "search.search_index_helpers.deindex_podcast_episode"
        ),
        index_run_content_files=mocker.patch(
            "search.search_index_helpers.index_run_content_files"
        ),
    )


@pytest.fixture()
def learning_resource_offeror():
    """Return a LearningResourceOfferer"""
    return LearningResourceOfferorFactory.create()


#
# @pytest.mark.parametrize("program_exists", [True, False])
# @pytest.mark.parametrize("is_published", [True, False])
# @pytest.mark.parametrize("courses_exist", [True, False])
# @pytest.mark.parametrize("has_retired_course", [True, False])
# def test_load_program(
#     # mock_upsert_tasks,
#     program_exists,
#     is_published,
#     courses_exist,
#     has_retired_course,
# ):  # pylint: disable=too-many-arguments
#     """Test that load_program loads the program"""
#
#         if program_exists
#         else ProgramFactory.build(courses=[], platform=platform)
#
#
#     if program_exists:
#
#         if courses_exist
#         else CourseFactory.build_batch(2, platform=platform)
#
#
#     if program_exists and has_retired_course:
#         program.learning_resource.resources.set(
#             },
#
#
#
#             "courses": [
#                 for course in courses
#             ],
#         },
#
#     # if program_exists and not is_published:
#
#
#     # assert we got a program back and that each course is in a program
#
#
#     assert result.runs.filter(published=True).first().start_date == _parse_datetime(
#
#     for relationship, data in zip(
#         sorted(
#         ),
#     ):
#
#
# @pytest.mark.parametrize("course_exists", [True, False])
# @pytest.mark.parametrize("is_published", [True, False])
# @pytest.mark.parametrize("is_run_published", [True, False])
# @pytest.mark.parametrize("blocklisted", [True, False])
# def test_load_course(  # pylint:disable=too-many-arguments
#     # mocker,
#     # mock_upsert_tasks,
#     course_exists,
#     is_published,
#     is_run_published,
#     blocklisted,
# ):
#     """Test that load_course loads the course"""
#     #    "learning_resources.etl.loaders.search_index_helpers.deindex_run_content_files"
#
#         if course_exists
#         else CourseFactory.build(runs=[], platform=platform)
#
#
#
#     if course_exists:
#
#
#     if is_run_published:
#
#
#
#     # if course_exists and (not is_published or not is_run_published) and not blocklisted:
#     if course_exists and is_published and not blocklisted:
#
#     assert LearningResourceRun.objects.filter(published=True).count() == (
#         1 if is_run_published else 0
#
#     # assert we got a course back
#
#     for key, value in props.items():
#
#
# @pytest.mark.parametrize("course_exists", [True, False])
# @pytest.mark.parametrize("course_id_is_duplicate", [True, False])
# @pytest.mark.parametrize("duplicate_course_exists", [True, False])
# def test_load_duplicate_course(
#     # mock_upsert_tasks,
#     course_exists,
#     course_id_is_duplicate,
#     duplicate_course_exists,
# ):
#     """Test that load_course loads the course"""
#
#         if course_exists
#         else CourseFactory.build()
#
#         if duplicate_course_exists
#         else CourseFactory.build()
#
#     if course_exists and duplicate_course_exists:
#
#             "duplicate_course_ids": [
#                 course.learning_resource.readable_id,
#                 duplicate_course.learning_resource.readable_id,
#             ],
#
#         duplicate_course.learning_resource.readable_id
#         if course_id_is_duplicate
#         else course.learning_resource.readable_id
#
#         "runs": [
#         ],
#
#
#     # if course_id_is_duplicate and duplicate_course_exists:
#
#
#
#     ).first()
#
#     for key, value in props.items():
#         assert (
#         ), f"Property {key} should be updated to {value} in the database"
#
#
# @pytest.mark.parametrize("run_exists", [True, False])
# def test_load_run(run_exists):
#     """Test that load_run loads the course run"""
#     #    "learning_resources.etl.loaders.load_content_files"
#         if run_exists
#         else LearningResourceRunFactory.build()
#
#
#
#
#
#
#
#     for key, value in props.items():
#
#
# @pytest.mark.parametrize("parent_factory", [CourseFactory, ProgramFactory])
# @pytest.mark.parametrize("topics_exist", [True, False])
# def test_load_topics(parent_factory, topics_exist):
#     """Test that load_topics creates and/or assigns topics to the parent object"""
#         if topics_exist
#         else LearningResourceTopicFactory.build_batch(3)
#
#
#
#
#
#
#
#
#
#
# @pytest.mark.parametrize("instructor_exists", [True, False])
# def test_load_instructors(instructor_exists):
#     """Test that load_instructors creates and/or assigns instructors to the course run"""
#         if instructor_exists
#         else LearningResourceInstructorFactory.build_batch(3)
#
#
#     load_instructors(
#
#
#
# @pytest.mark.parametrize("parent_factory", [CourseFactory, ProgramFactory])
# @pytest.mark.parametrize("offeror_exists", [True, False])
# @pytest.mark.parametrize("has_other_offered_by", [True, False])
# @pytest.mark.parametrize("additive", [True, False])
# @pytest.mark.parametrize("null_data", [True, False])
# def test_load_offered_bys(
#     parent_factory, offeror_exists, has_other_offered_by, additive, null_data
# ):
#     """Test that load_offered_bys creates and/or assigns offeror to the parent object"""
#         if offeror_exists
#         else LearningResourceOfferorFactory.build(is_xpro=True)
#
#
#     if not null_data:
#
#     if has_other_offered_by and (additive or null_data):
#
#     if has_other_offered_by:
#
#     assert parent.learning_resource.offered_by.count() == (
#         1 if has_other_offered_by else 0
#
#     load_offered_bys(
#         parent.learning_resource,
#
#     assert set(
#     ) == set(expected)
#
#
# @pytest.mark.parametrize("prune", [True, False])
# def test_load_courses(mocker, mock_blocklist, mock_duplicates, prune):
#     """Test that load_courses calls the expected functions"""
#
#
#         {"readable_id": course.learning_resource.readable_id} for course in courses
#         "learning_resources.etl.loaders.load_course",
#     load_courses(
#     for course_data in courses_data:
#         mock_load_course.assert_any_call(
#             course_data,
#     assert course_to_unpublish.learning_resource.published is not prune
#
#
# def test_load_programs(mocker, mock_blocklist, mock_duplicates):
#     """Test that load_programs calls the expected functions"""
#
#
# @pytest.mark.parametrize("is_published", [True, False])
# def test_load_content_files(mocker, is_published):
#     """Test that load_content_files calls the expected functions"""
#
#
#         "learning_resources.etl.loaders.load_content_file",
#
#
# def test_load_content_file():
#     """Test that load_content_file saves a ContentFile object"""
#
#
#
#
#     # assert we got an integer back
#
#
#     for key, value in props.items():
#         assert (
#         ), f"Property {key} should equal {value}"
#
#
# def test_load_content_file_error(mocker):
#     """Test that an exception in load_content_file is logged"""
#     mock_log.assert_called_once_with(
#


def test_load_podcasts(learning_resource_offeror):
    """Test load_podcasts"""

    podcasts_data = []
    for podcast in PodcastFactory.build_batch(3):
        episodes = PodcastEpisodeFactory.build_batch(3)
        podcast_data = model_to_dict(
            podcast.learning_resource, exclude=non_transformable_attributes
        )
        podcast_data["image"] = {"url": podcast.learning_resource.image.url}
        podcast_data["offered_by"] = [{"name": learning_resource_offeror.name}]
        episodes_data = [
            model_to_dict(
                episode.learning_resource, exclude=non_transformable_attributes
            )
            for episode in episodes
        ]
        podcast_data["episodes"] = episodes_data
        podcasts_data.append(podcast_data)

    results = load_podcasts(podcasts_data)

    assert len(results) == len(podcasts_data)

    for result in results:
        assert isinstance(result, LearningResource)
        assert result.resource_type == LearningResourceType.podcast.value
        assert result.platform.platform == PlatformType.podcast.value
        assert result.children.count() > 0
        for relation in result.children.all():
            assert (
                relation.child.resource_type
                == LearningResourceType.podcast_episode.value
            )
            assert (
                relation.relation_type
                == LearningResourceRelationTypes.PODCAST_EPISODES.value
            )


def test_load_podcasts_unpublish():
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
    learning_resource_offeror, podcast_episode_exists, is_published
):
    """Test that load_podcast_episode loads the podcast episode"""
    podcast_episode = (
        PodcastEpisodeFactory.create(is_unpublished=not is_published)
        if podcast_episode_exists
        else PodcastEpisodeFactory.build(is_unpublished=not is_published)
    ).learning_resource

    props = model_to_dict(podcast_episode, exclude=non_transformable_attributes)
    props["image"] = {"url": podcast_episode.image.url}
    props["offered_by"] = [{"name": learning_resource_offeror.name}]
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
    assert result.resource_type == LearningResourceType.podcast_episode.value
    assert result.podcast_episode is not None

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"


@pytest.mark.parametrize("podcast_exists", [True, False])
def test_load_podcast(learning_resource_offeror, podcast_exists):
    """Test that load_podcast loads the podcast"""
    podcast = (
        PodcastFactory.create(episodes=[])
        if podcast_exists
        else PodcastFactory.build(episodes=[])
    ).learning_resource
    existing_podcast_episode = (
        PodcastEpisodeFactory.create().learning_resource if podcast_exists else None
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
    podcast_data["offered_by"] = [{"name": learning_resource_offeror.name}]
    topics = (
        podcast.topics.all()
        if podcast_exists
        else LearningResourceTopicFactory.build_batch(2)
    )
    podcast_data["topics"] = [model_to_dict(topic) for topic in topics]

    episode = PodcastEpisodeFactory.build().learning_resource
    episode_data = model_to_dict(episode, exclude=non_transformable_attributes)
    episode_data["image"] = {"url": episode.image.url}
    episode_data["offered_by"] = [{"name": learning_resource_offeror.name}]

    podcast_data["episodes"] = [episode_data]
    load_podcast(podcast_data)

    new_podcast = LearningResource.objects.get(readable_id=podcast.readable_id)
    new_podcast_episode = new_podcast.resources.order_by("-created_on").first()

    assert new_podcast.title == "New Title"
    assert new_podcast_episode.published is True
    if podcast_exists:
        assert new_podcast.id == podcast.id
        assert new_podcast.resources.count() == 2
    else:
        assert new_podcast.resources.count() == 1
