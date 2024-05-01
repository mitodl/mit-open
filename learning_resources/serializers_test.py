"""Tests for learning_resources serializers"""

from urllib.parse import urljoin

import pytest
from django.conf import settings

from channels.factories import (
    ChannelDepartmentDetailFactory,
    ChannelOfferorDetailFactory,
    ChannelTopicDetailFactory,
)
from channels.models import FieldChannel
from learning_resources import factories, serializers, utils
from learning_resources.constants import (
    LearningResourceFormat,
    LearningResourceRelationTypes,
    LearningResourceType,
    PlatformType,
)
from main.test_utils import assert_json_equal, drf_datetime

pytestmark = pytest.mark.django_db


datetime_format = "%Y-%m-%dT%H:%M:%SZ"
datetime_millis_format = "%Y-%m-%dT%H:%M:%S.%fZ"


def test_serialize_course_to_json():
    """
    Verify that a serialized course contains the expected attributes
    """
    course = factories.CourseFactory.create()
    serializer = serializers.CourseSerializer(instance=course)

    assert_json_equal(
        serializer.data,
        {
            "course_numbers": serializers.CourseNumberSerializer(
                instance=course.course_numbers, many=True
            ).data
        },
    )


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

    assert_json_equal(
        serializer.data,
        {
            "courses": [
                # this is currently messy because program.courses is a list of LearningResourceRelationships
                serializers.CourseResourceSerializer(instance=course_rel.child).data
                for course_rel in program.courses.filter(child__published=True)
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


@pytest.mark.parametrize("has_context", [True, False])
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
def test_learning_resource_serializer(  # noqa: PLR0913
    rf,
    user,
    has_context,
    params,
    detail_key,
    specific_serializer_cls,
    detail_serializer_cls,
):
    """Test that LearningResourceSerializer uses the correct serializer"""
    request = rf.get("/")
    request.user = user
    context = {"request": request} if has_context else {}

    resource = factories.LearningResourceFactory.create(**params)
    for department in resource.departments.all():
        ChannelDepartmentDetailFactory.create(department=department)

    result = serializers.LearningResourceSerializer(
        instance=resource, context=context
    ).data
    expected = specific_serializer_cls(instance=resource, context=context).data

    assert result == expected

    assert result == {
        "id": resource.id,
        "certification": resource.certification,
        "title": resource.title,
        "description": resource.description,
        "full_description": resource.full_description,
        "languages": resource.languages,
        "last_modified": drf_datetime(resource.last_modified),
        "learning_path_parents": [],
        "offered_by": serializers.LearningResourceOfferorSerializer(
            instance=resource.offered_by
        ).data,
        "platform": serializers.LearningResourcePlatformSerializer(
            instance=resource.platform
        ).data,
        "prices": resource.prices,
        "professional": resource.professional,
        "published": resource.published,
        "readable_id": resource.readable_id,
        "course_feature": [tag.name for tag in resource.content_tags.all()],
        "resource_type": resource.resource_type,
        "url": resource.url,
        "user_list_parents": [],
        "image": serializers.LearningResourceImageSerializer(
            instance=resource.image
        ).data,
        "departments": [
            {
                "department_id": dept.department_id,
                "name": dept.name,
                "channel_url": urljoin(
                    settings.SITE_BASE_URL,
                    f"/c/department/{FieldChannel.objects.get(department_detail__department=dept).name}/",
                ),
                "school": {
                    "id": dept.school.id,
                    "name": dept.school.name,
                    "url": dept.school.url,
                },
            }
            for dept in resource.departments.all()
        ],
        "topics": [
            serializers.LearningResourceTopicSerializer(topic).data
            for topic in resource.topics.all()
        ],
        "runs": [
            serializers.LearningResourceRunSerializer(instance=run).data
            for run in resource.runs.all()
        ],
        detail_key: detail_serializer_cls(instance=getattr(resource, detail_key)).data,
        "views": resource.views.count(),
        "learning_format": [
            {"code": lr_format, "name": LearningResourceFormat[lr_format].value}
            for lr_format in resource.learning_format
        ],
        "next_start_date": resource.next_start_date,
    }


@pytest.mark.parametrize("has_context", [True, False])
@pytest.mark.parametrize("is_staff", [True, False])
@pytest.mark.parametrize("is_superuser", [True, False])
@pytest.mark.parametrize("is_editor_staff", [True, False])
@pytest.mark.parametrize(
    "params",
    [
        {"is_program": True},
        {"is_course": True},
        {"is_learning_path": True},
        {"is_podcast": True},
        {"is_podcast_episode": True},
    ],
)
def test_learning_resource_serializer_learning_path_parents(  # noqa: PLR0913
    rf, user, has_context, is_staff, is_superuser, is_editor_staff, params
):
    """Test that LearningResourceSerializer.learning_path_parents returns the expected values"""
    request = rf.get("/")
    request.user = user
    context = {"request": request} if has_context else {}

    user.is_staff = is_staff
    user.is_superuser = is_superuser
    user.save()

    utils.update_editor_group(user, is_editor_staff)

    resource = factories.LearningResourceFactory.create(**params)

    factories.LearningResourceFactory.create_batch(
        5, is_learning_path=True, learning_path__resources=[resource]
    )

    result = serializers.LearningResourceSerializer(
        instance=resource, context=context
    ).data

    can_see_parents = has_context and (is_staff or is_superuser or is_editor_staff)

    assert result["learning_path_parents"] == (
        serializers.MicroLearningPathRelationshipSerializer(
            instance=resource.parents.all(), many=True
        ).data
        if can_see_parents
        else []
    )


@pytest.mark.parametrize("has_context", [True, False])
@pytest.mark.parametrize(
    "params",
    [
        {"is_program": True},
        {"is_course": True},
        {"is_learning_path": True},
        {"is_podcast": True},
        {"is_podcast_episode": True},
    ],
)
def test_learning_resource_serializer_user_list_parents(rf, user, has_context, params):
    """Test that LearningResourceSerializer.user_list_parents returns the expected values"""
    request = rf.get("/")
    request.user = user
    context = {"request": request} if has_context else {}

    resource = factories.LearningResourceFactory.create(**params)

    parent_rels = factories.UserListRelationshipFactory.create_batch(
        5,
        child=resource,
        parent__author=user,
    )

    result = serializers.LearningResourceSerializer(
        instance=resource, context=context
    ).data

    assert result["user_list_parents"] == (
        serializers.MicroUserListRelationshipSerializer(
            instance=parent_rels, many=True
        ).data
        if has_context
        else []
    )


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
        (9999, "Invalid topic ids: {9999}"),
        (None, "Invalid topic ids: {None}"),
        ("a", "Topic ids must be integers"),
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
        "child": (
            factories.CourseFactory.create().learning_resource.id
            if child_exists
            else 9999
        ),
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


@pytest.mark.parametrize(
    "expected_types", [["Assignments", "Tools"], ["Lecture Audio"], [], None]
)
@pytest.mark.parametrize("has_channels", [True, False])
def test_content_file_serializer(settings, expected_types, has_channels):
    """Verify that the ContentFileSerializer has the correct data"""
    settings.SITE_BASE_URL = "https://test.edu/"
    content_kwargs = {
        "content": "Test content",
        "content_author": "MIT",
        "content_language": "en",
        "content_title": "test title",
    }
    platform = PlatformType.ocw.name
    course = factories.CourseFactory.create(platform=platform)
    content_file = factories.ContentFileFactory.create(
        run=course.learning_resource.runs.first(), **content_kwargs
    )
    if has_channels:
        [
            ChannelTopicDetailFactory.create(topic=topic)
            for topic in content_file.run.learning_resource.topics.all()
        ]
        [
            ChannelDepartmentDetailFactory.create(department=department)
            for department in course.learning_resource.departments.all()
        ]
        ChannelOfferorDetailFactory.create(offeror=course.learning_resource.offered_by)

    serialized = serializers.ContentFileSerializer(content_file).data

    assert_json_equal(
        serialized,
        {
            "id": content_file.id,
            "run_id": content_file.run.id,
            "run_readable_id": content_file.run.run_id,
            "platform": {
                "name": PlatformType[platform].value,
                "code": platform,
            },
            "offered_by": {
                "name": content_file.run.learning_resource.offered_by.name,
                "code": content_file.run.learning_resource.offered_by.code,
                "channel_url": urljoin(
                    settings.SITE_BASE_URL,
                    f"/c/offeror/{FieldChannel.objects.get(offeror_detail__offeror=content_file.run.learning_resource.offered_by).name}/",
                )
                if has_channels
                else None,
            },
            "run_title": content_file.run.title,
            "run_slug": content_file.run.slug,
            "departments": [
                {
                    "name": dept.name,
                    "department_id": dept.department_id,
                    "channel_url": urljoin(
                        settings.SITE_BASE_URL,
                        f"/c/department/{FieldChannel.objects.get(department_detail__department=dept).name}/",
                    )
                    if has_channels
                    else None,
                    "school": {
                        "id": dept.school.id,
                        "name": dept.school.name,
                        "url": dept.school.url,
                    }
                    if dept.school
                    else None,
                }
                for dept in content_file.run.learning_resource.departments.all()
            ],
            "semester": content_file.run.semester,
            "year": int(content_file.run.year),
            "topics": [
                {
                    "name": topic.name,
                    "id": topic.id,
                    "parent": topic.parent,
                    "channel_url": urljoin(
                        settings.SITE_BASE_URL,
                        f"/c/topic/{FieldChannel.objects.get(topic_detail__topic=topic).name}/"
                        if has_channels
                        else None,
                    )
                    if has_channels
                    else None,
                }
                for topic in content_file.run.learning_resource.topics.all()
            ],
            "key": content_file.key,
            "uid": content_file.uid,
            "title": content_file.title,
            "description": content_file.description,
            "file_type": content_file.file_type,
            "content_type": content_file.content_type,
            "url": content_file.url,
            "content": content_kwargs["content"],
            "content_title": content_kwargs["content_title"],
            "content_author": content_kwargs["content_author"],
            "content_language": content_kwargs["content_language"],
            "image_src": content_file.image_src,
            "resource_id": str(content_file.run.learning_resource.id),
            "resource_readable_id": content_file.run.learning_resource.readable_id,
            "course_number": [
                coursenum["value"]
                for coursenum in content_file.run.learning_resource.course.course_numbers
            ],
            "content_feature_type": [
                tag.name for tag in content_file.content_tags.all()
            ],
        },
    )
