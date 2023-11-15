"""Tests for learning_resources serializers"""
import pytest

from learning_resources import factories, serializers
from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
)
from learning_resources.serializers import fields
from open_discussions.test_utils import assert_json_equal, drf_datetime

pytestmark = pytest.mark.django_db


datetime_format = "%Y-%m-%dT%H:%M:%SZ"
datetime_millis_format = "%Y-%m-%dT%H:%M:%S.%fZ"


def test_serialize_course_to_json():
    """
    Verify that a serialized course contains the expected attributes
    """
    course = factories.CourseFactory.create()
    serializer = serializers.CourseSerializer(instance=course)

    assert_json_equal(serializer.data, {"course_numbers": []})


def test_serialize_program_to_json():
    """
    Verify that a serialized program contains courses as LearningResources
    """
    program = factories.ProgramFactory.create()

    # Add an unpublished course to the program
    course = factories.CourseFactory.create(is_unpublished=True)
    program.learning_resource.resources.add(
        course.learning_resource,
        through_defaults={
            "relation_type": LearningResourceRelationTypes.PROGRAM_COURSES
        },
    )

    serializer = serializers.ProgramSerializer(instance=program)

    result = serializer.data

    assert len(result["courses"]) == program.courses.count() - 1

    assert_json_equal(
        serializer.data,
        {
            "courses": [
                # this is currently messy because program.courses is a list of LearningResourceRelationships
                serializers.CourseResourceSerializer(instance=course_rel.child).data
                for course_rel in program.courses.filter(child__published=False)
            ]
        },
    )


def test_serialize_learning_path_to_json():
    """
    Verify that a serialized learning path has the correct data
    """
    learning_path = factories.LearningPathFactory.create()
    serializer = serializers.LearningPathSerializer(instance=learning_path)

    assert_json_equal(
        serializer.data,
        {
            "author": learning_path.author_id,
            "id": learning_path.id,
            "item_count": learning_path.learning_resource.children.count(),
        },
    )


def test_serialize_podcast_to_json():
    """
    Verify that a serialized podcast has the correct data
    """
    podcast = factories.PodcastFactory.create()
    serializer = serializers.PodcastSerializer(instance=podcast)

    assert_json_equal(
        serializer.data,
        {
            "apple_podcasts_url": podcast.apple_podcasts_url,
            "episode_count": podcast.learning_resource.children.count(),
            "google_podcasts_url": podcast.google_podcasts_url,
            "id": podcast.id,
            "rss_url": podcast.rss_url,
        },
    )


def test_serialize_podcast_episode_to_json():
    """
    Verify that a serialized podcast episode has the correct data
    """
    podcast_episode = factories.PodcastEpisodeFactory.create()
    serializer = serializers.PodcastEpisodeSerializer(instance=podcast_episode)

    assert_json_equal(
        serializer.data,
        {
            "duration": podcast_episode.duration,
            "episode_link": podcast_episode.episode_link,
            "id": podcast_episode.id,
            "rss": podcast_episode.rss,
            "transcript": podcast_episode.transcript,
        },
    )


@pytest.mark.parametrize(
    ("params", "detail_key", "specific_serializer_cls", "detail_serializer_cls"),
    [
        (
            {"is_program": True},
            "program",
            serializers.ProgramResourceSerializer,
            serializers.ProgramSerializer,
        ),
        (
            {"is_course": True},
            "course",
            serializers.CourseResourceSerializer,
            serializers.CourseSerializer,
        ),
        (
            {"is_learning_path": True},
            "learning_path",
            serializers.LearningPathResourceSerializer,
            serializers.LearningPathSerializer,
        ),
        (
            {"is_podcast": True},
            "podcast",
            serializers.PodcastResourceSerializer,
            serializers.PodcastSerializer,
        ),
        (
            {"is_podcast_episode": True},
            "podcast_episode",
            serializers.PodcastEpisodeResourceSerializer,
            serializers.PodcastEpisodeSerializer,
        ),
    ],
)
def test_learning_resource_serializer(
    params, detail_key, specific_serializer_cls, detail_serializer_cls
):
    """Test that LearningResourceSerializer uses the correct serializer"""
    resource = factories.LearningResourceFactory.create(**params)

    result = serializers.LearningResourceSerializer(instance=resource).data
    expected = specific_serializer_cls(instance=resource).data

    assert result == expected

    assert result == {
        "id": resource.id,
        "certification": resource.certification,
        "title": resource.title,
        "description": resource.description,
        "full_description": resource.full_description,
        "etl_source": resource.etl_source,
        "languages": resource.languages,
        "last_modified": drf_datetime(resource.last_modified),
        "learning_path_parents": [],
        "offered_by": resource.offered_by.name,
        "platform": resource.platform.platform,
        "prices": resource.prices,
        "professional": resource.professional,
        "published": resource.published,
        "readable_id": resource.readable_id,
        "resource_content_tags": [
            tag.name for tag in resource.resource_content_tags.all()
        ],
        "resource_type": resource.resource_type,
        "url": resource.url,
        "user_list_parents": [],
        "image": fields.LearningResourceImageSerializer(instance=resource.image).data,
        "departments": list(resource.departments.values("department_id", "name")),
        "topics": list(resource.topics.values("id", "name")),
        "runs": [
            serializers.LearningResourceRunSerializer(instance=run).data
            for run in resource.runs.all()
        ],
        detail_key: detail_serializer_cls(instance=getattr(resource, detail_key)).data,
    }


def test_serialize_run_related_models():
    """
    Verify that a serialized run contains attributes for related objects
    """
    run = factories.LearningResourceRunFactory()
    serializer = serializers.LearningResourceRunSerializer(run)
    assert len(serializer.data["prices"]) > 0
    assert str(serializer.data["prices"][0].replace(".", "")).isnumeric()
    assert len(serializer.data["instructors"]) > 0
    for attr in ("first_name", "last_name", "full_name"):
        assert attr in serializer.data["instructors"][0]


@pytest.mark.parametrize(
    ("data", "error"),
    [
        [9999, "Invalid topic ids: {9999}"],  # noqa: PT007
        [None, "Invalid topic ids: {None}"],  # noqa: PT007
        ["a", "Topic ids must be integers"],  # noqa: PT007
    ],
)
def test_learningpath_serializer_validation_bad_topic(data, error):
    """
    Test that the LearningPathResourceSerializer invalidates a non-existent topic
    """
    serializer_data = {
        "readable_id": "abc123",
        "title": "My List",
        "description": "My Description",
        "topics": [data],
        "resource_type": LearningResourceType.learning_path.name,
    }
    serializer = serializers.LearningPathResourceSerializer(data=serializer_data)
    assert serializer.is_valid() is False
    assert serializer.errors["topics"][0] == error


def test_learningpath_serializer_validation():
    """
    Test that the LearningPathResourceSerializer validates and saves properly
    """
    topic_ids = [
        topic.id for topic in factories.LearningResourceTopicFactory.create_batch(3)
    ]
    serializer_data = {
        "readable_id": "abc123",
        "title": "My List",
        "description": "My Description",
        "topics": topic_ids,
        "resource_type": LearningResourceType.learning_path.name,
    }
    serializer = serializers.LearningPathResourceSerializer(data=serializer_data)
    assert serializer.is_valid(raise_exception=True)


@pytest.mark.parametrize("child_exists", [True, False])
def test_learningpathitem_serializer_validation(child_exists):
    """
    Test that the StaffListItemSerializer validates content_type and object correctly
    """
    learning_path = factories.LearningPathFactory.create()
    data = {
        "parent": learning_path.learning_resource.id,
        "child": factories.CourseFactory.create().learning_resource.id
        if child_exists
        else 9999,
        "relation_type": LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value,
    }
    serializer = serializers.LearningResourceRelationshipSerializer(data=data)
    assert serializer.is_valid() is child_exists
    if child_exists:
        serializer.save()
        saved_item = learning_path.learning_resource.children.all().first()
        assert (
            saved_item.relation_type
            == LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
        )
