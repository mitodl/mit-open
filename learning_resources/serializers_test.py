"""Tests for learning_resources serializers"""
import pytest

from learning_resources import constants, factories, serializers
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

    assert_json_equal(serializer.data, {"extra_course_numbers": []})


def test_serialize_program_to_json():
    """
    Verify that a serialized program contains courses as LearningResources
    """
    program = factories.ProgramFactory.create()
    serializer = serializers.ProgramSerializer(instance=program)

    assert_json_equal(
        serializer.data,
        {
            "courses": [
                # this is currently messy because program.courses is a list of LearningResourceRelationships
                serializers.CourseResourceSerializer(instance=course_rel.child).data
                for course_rel in program.courses
            ]
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
        "resource_type": LearningResourceType.learning_path.value,
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
        "resource_type": LearningResourceType.learning_path.value,
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


def test_content_file_serializer():
    """Verify that the ContentFileSerializer has the correct data"""
    content_kwargs = {
        "content": "Test content",
        "content_author": "MIT",
        "content_language": "en",
        "content_title": "test title",
        "section": "test section",
    }
    platform = constants.PlatformType.xpro.value
    course = factories.CourseFactory.create(platform=platform)
    content_file = factories.ContentFileFactory.create(
        run=course.learning_resource.runs.first(), **content_kwargs
    )

    serialized = serializers.ContentFileSerializer(content_file).data

    assert_json_equal(
        serialized,
        {
            "id": content_file.id,
            "run_id": content_file.run.run_id,
            "run_title": content_file.run.title,
            "run_slug": content_file.run.slug,
            "departments": [
                {"name": dept.name, "department_id": dept.department_id}
                for dept in content_file.run.learning_resource.departments.all()
            ],
            "semester": content_file.run.semester,
            "year": int(content_file.run.year),
            "topics": list(
                content_file.run.learning_resource.topics.values_list("name", flat=True)
            ),
            "key": content_file.key,
            "uid": content_file.uid,
            "title": content_file.title,
            "short_description": content_file.description,
            "file_type": content_file.file_type,
            "content_type": content_file.content_type,
            "url": content_file.url,
            "short_url": content_file.short_url,
            "section": content_file.section,
            "section_slug": content_file.section_slug,
            "content": content_kwargs["content"],
            "content_title": content_kwargs["content_title"],
            "content_author": content_kwargs["content_author"],
            "content_language": content_kwargs["content_language"],
            "image_src": content_file.image_src,
            "resource_id": str(content_file.run.learning_resource.id),
            "resource_readable_id": content_file.run.learning_resource.readable_id,
            "resource_readable_num": content_file.run.learning_resource.readable_id.split(
                "+"
            )[
                -1
            ],
            "resource_type": None,
        },
    )
