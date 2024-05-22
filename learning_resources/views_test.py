"""Test for learning_resources views"""

import random
from datetime import timedelta

import pytest
from _pytest.fixtures import fixture
from django.utils import timezone
from rest_framework.reverse import reverse

from channels.factories import ChannelOfferorDetailFactory
from channels.models import FieldChannel
from learning_resources.constants import (
    FEATURED_OFFERORS,
    LearningResourceRelationTypes,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.exceptions import WebhookException
from learning_resources.factories import (
    ContentFileFactory,
    CourseFactory,
    LearningPathFactory,
    LearningResourceDepartmentFactory,
    LearningResourceFactory,
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
    LearningResourceRunFactory,
    LearningResourceTopicFactory,
    LearningResourceViewEventFactory,
    PodcastEpisodeFactory,
    PodcastFactory,
    ProgramFactory,
    VideoFactory,
    VideoPlaylistFactory,
)
from learning_resources.models import (
    LearningResourceOfferor,
    LearningResourceRelationship,
    LearningResourceRun,
)
from learning_resources.serializers import (
    ContentFileSerializer,
    LearningResourceDepartmentSerializer,
    LearningResourceOfferorDetailSerializer,
    LearningResourcePlatformSerializer,
    LearningResourceTopicSerializer,
    PodcastEpisodeSerializer,
    PodcastSerializer,
    VideoPlaylistSerializer,
    VideoResourceSerializer,
    VideoSerializer,
)

pytestmark = [pytest.mark.django_db]


@fixture()
def offeror_featured_lists():
    """Generate featured offeror lists for testing"""
    for offered_by in FEATURED_OFFERORS:
        offeror = LearningResourceOfferorFactory.create(code=offered_by.name)
        featured_path = LearningPathFactory.create(resources=[]).learning_resource
        for i in range(3):
            resource = LearningResourceFactory.create(
                offered_by=offeror,
                is_course=True,
                certification=bool(random.getrandbits(1)),
                professional=bool(random.getrandbits(1)),
            )
            if offered_by.name == OfferedBy.ocw.name:
                LearningResourceRun.objects.filter(
                    learning_resource=resource.id
                ).update(prices=[])
            featured_path.resources.add(
                resource,
                through_defaults={
                    "relation_type": LearningResourceRelationTypes.LEARNING_PATH_ITEMS,
                    "position": i,
                },
            )
        channel = ChannelOfferorDetailFactory.create(offeror=offeror).channel
        channel.featured_list = featured_path
        channel.save()


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:courses_api-list", ""),
        ("lr:v1:learning_resources_api-list", "resource_type=course"),
    ],
)
def test_list_course_endpoint(client, url, params):
    """Test courses endpoint"""
    courses = sorted(
        CourseFactory.create_batch(2), key=lambda course: course.learning_resource.id
    )
    # this should be filtered out
    CourseFactory.create_batch(5, is_unpublished=True)

    resp = client.get(f"{reverse(url)}?{params}")
    assert resp.data.get("count") == 2
    for idx, course in enumerate(courses):
        assert resp.data.get("results")[idx]["id"] == course.learning_resource.id


@pytest.mark.parametrize(
    "url", ["lr:v1:courses_api-detail", "lr:v1:learning_resources_api-detail"]
)
def test_get_course_detail_endpoint(client, url):
    """Test course detail endpoint"""
    course = CourseFactory.create()

    resp = client.get(reverse(url, args=[course.learning_resource.id]))

    assert resp.data.get("readable_id") == course.learning_resource.readable_id


@pytest.mark.parametrize(
    "url",
    [
        "lr:v1:learning_resource_content_files_api-list",
        "lr:v1:course_content_files_api-list",
    ],
)
def test_get_course_content_files_endpoint(client, url):
    """Test course detail contentfiles endpoint"""
    course = CourseFactory.create()
    content_files = sorted(
        ContentFileFactory.create_batch(17, run=course.learning_resource.runs.first()),
        key=lambda content_file: content_file.created_on,
        reverse=True,
    )
    ContentFileFactory.create(
        run=course.learning_resource.runs.first(), published=False
    )

    resp = client.get(reverse(url, args=[course.learning_resource.id]))

    assert resp.data.get("count") == 17
    for idx, content_file in enumerate(content_files[:10]):
        assert resp.data.get("results")[idx]["id"] == content_file.id


@pytest.mark.parametrize(
    ("reverse_url", "expected_url"),
    [
        (
            "lr:v1:learning_resource_content_files_api-list",
            "/api/v1/learning_resources/{}/contentfiles/",
        ),
        ("lr:v1:course_content_files_api-list", "/api/v1/courses/{}/contentfiles/"),
    ],
)
def test_get_course_content_files_filtered(client, reverse_url, expected_url):
    """Test course detail contentfiles endpoint"""
    course = CourseFactory.create()
    ContentFileFactory.create_batch(2, run=course.learning_resource.runs.first())
    ContentFileFactory.create_batch(3, run=course.learning_resource.runs.last())

    expected_url = expected_url.format(course.learning_resource.id)
    assert reverse(reverse_url, args=[course.learning_resource.id]) == expected_url

    resp = client.get(
        f"{expected_url}?run_id={course.learning_resource.runs.first().id}"
    )
    assert resp.data.get("count") == 2

    resp = client.get(
        f"{expected_url}?run_id={course.learning_resource.runs.last().id}"
    )
    assert resp.data.get("count") == 3


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:programs_api-list", ""),
        ("lr:v1:learning_resources_api-list", "resource_type=program"),
    ],
)
def test_program_endpoint(client, url, params):
    """Test program endpoint"""
    programs = ProgramFactory.create_batch(3)

    resp = client.get(f"{reverse(url)}?{params}")
    for i in range(3):
        assert resp.data.get("results")[i]["id"] == programs[i].learning_resource.id


@pytest.mark.parametrize(
    "url", ["lr:v1:programs_api-detail", "lr:v1:learning_resources_api-detail"]
)
def test_program_detail_endpoint(client, url):
    """Test program endpoint"""
    program = ProgramFactory.create()
    resp = client.get(reverse(url, args=[program.learning_resource.id]))
    assert resp.data.get("title") == program.learning_resource.title
    assert resp.data.get("resource_type") == LearningResourceType.program.name
    response_courses = sorted(resp.data["program"]["courses"], key=lambda i: i["id"])

    courses = sorted(
        [relation.child for relation in program.courses.all()], key=lambda lr: lr.id
    )
    assert len(response_courses) == len(courses)
    assert [course.id for course in courses] == [
        course["id"] for course in response_courses
    ]
    for idx, course in enumerate(courses):
        assert course.id == response_courses[idx]["id"]
        assert (
            response_courses[idx]["resource_type"] == LearningResourceType.course.name
        )


def test_list_resources_endpoint(client):
    """Test unfiltered learning_resources endpoint"""
    courses = CourseFactory.create_batch(2)
    programs = ProgramFactory.create_batch(2)
    resource_ids = [resource.learning_resource.id for resource in [*courses, *programs]]
    resource_ids.extend(
        [
            course.child.id
            for sublist in [program.courses.all() for program in programs]
            for course in sublist
        ]
    )

    # this should be filtered out
    CourseFactory.create(is_unpublished=True)

    resp = client.get(reverse("lr:v1:learning_resources_api-list"))
    assert resp.data.get("count") == len(set(resource_ids))
    for result in resp.data["results"]:
        assert result["id"] in resource_ids


@pytest.mark.parametrize("course_count", [1, 5, 10])
def test_no_excess_queries(mocker, django_assert_num_queries, course_count):
    """
    There should be a constant number of queries made (based on number of
    related models), regardless of number of results returned.
    """
    from learning_resources.views import CourseViewSet

    CourseFactory.create_batch(course_count)

    with django_assert_num_queries(10):
        view = CourseViewSet(request=mocker.Mock(query_params=[]))
        results = view.get_queryset().all()
        assert len(results) == course_count


def test_list_content_files_list_endpoint(client):
    """Test ContentFile list endpoint"""
    course = CourseFactory.create()
    content_file_ids = [
        cf.id
        for cf in ContentFileFactory.create_batch(
            2, run=course.learning_resource.runs.first()
        )
    ]
    # this should be filtered out
    ContentFileFactory.create_batch(5, published=False)

    assert reverse("lr:v1:contentfiles_api-list") == "/api/v1/contentfiles/"

    resp = client.get(f"{reverse('lr:v1:contentfiles_api-list')}")
    assert resp.data.get("count") == 2
    for result in resp.data.get("results"):
        assert result["id"] in content_file_ids


def test_list_content_files_list_filtered(client):
    """Test ContentFile list endpoint"""
    course_1 = CourseFactory.create()
    ContentFileFactory.create_batch(2, run=course_1.learning_resource.runs.first())
    course_2 = CourseFactory.create()
    ContentFileFactory.create_batch(3, run=course_2.learning_resource.runs.first())

    resp = client.get(
        f"{reverse('lr:v1:contentfiles_api-list')}?run_id={course_1.learning_resource.runs.first().id}"
    )
    assert resp.data.get("count") == 2
    resp = client.get(
        f"{reverse('lr:v1:contentfiles_api-list')}?resource_id={course_2.learning_resource.id}"
    )
    assert resp.data.get("count") == 3
    resp = client.get(f"{reverse('lr:v1:contentfiles_api-list')}?resource_id=1001001")
    assert resp.data.get("count") == 0


def test_get_contentfiles_detail_endpoint(client):
    """Test ContentFile detail endpoint"""
    content_file = ContentFileFactory.create()

    url = reverse("lr:v1:contentfiles_api-detail", args=[content_file.id])
    assert url == f"/api/v1/contentfiles/{content_file.id}/"

    resp = client.get(url)
    assert resp.data == ContentFileSerializer(instance=content_file).data


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:podcasts_api-list", ""),
        ("lr:v1:learning_resources_api-list", "resource_type=podcast"),
    ],
)
def test_list_podcast_endpoint(client, url, params):
    """Test podcast endpoint"""
    podcasts = sorted(
        PodcastFactory.create_batch(2), key=lambda podcast: podcast.learning_resource.id
    )
    # this should be filtered out
    PodcastFactory.create_batch(5, is_unpublished=True)

    resp = client.get(f"{reverse(url)}?{params}")
    assert resp.data.get("count") == 2

    for idx, podcast in enumerate(podcasts):
        assert resp.data.get("results")[idx]["id"] == podcast.learning_resource.id
        assert (
            resp.data.get("results")[idx]["podcast"]
            == PodcastSerializer(instance=podcast).data
        )


@pytest.mark.parametrize(
    "url", ["lr:v1:podcasts_api-detail", "lr:v1:learning_resources_api-detail"]
)
def test_get_podcast_detail_endpoint(client, url):
    """Test podcast detail endpoint"""
    podcast = PodcastFactory.create()

    resp = client.get(reverse(url, args=[podcast.learning_resource.id]))

    assert resp.data.get("readable_id") == podcast.learning_resource.readable_id
    assert resp.data.get("podcast") == PodcastSerializer(instance=podcast).data


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:podcast_episodes_api-list", "sortby=-last_modified"),
        (
            "lr:v1:learning_resources_api-list",
            "resource_type=podcast_episode&sortby=-last_modified",
        ),
    ],
)
def test_list_podcast_episode_endpoint(client, url, params):
    """Test podcast episode endpoint"""
    podcast = PodcastFactory.create().learning_resource

    # this should be filtered out
    podcast.resources.add(
        PodcastEpisodeFactory.create(is_unpublished=True).learning_resource,
        through_defaults={
            "relation_type": LearningResourceRelationTypes.PODCAST_EPISODES.value
        },
    )

    resp = client.get(f"{reverse(url)}?{params}")
    assert resp.data.get("count") == podcast.resources.count() - 1

    for idx, episode in enumerate(
        sorted(
            podcast.resources.filter(published=True),
            key=lambda episode: episode.last_modified,
            reverse=True,
        )
    ):
        assert resp.data.get("results")[idx]["id"] == episode.id
        assert (
            resp.data.get("results")[idx]["podcast_episode"]
            == PodcastEpisodeSerializer(instance=episode.podcast_episode).data
        )


@pytest.mark.parametrize(
    "url", ["lr:v1:podcast_episodes_api-detail", "lr:v1:learning_resources_api-detail"]
)
def test_get_podcast_episode_detail_endpoint(client, url):
    """Test podcast episode detail endpoint"""
    episode = PodcastEpisodeFactory.create()

    resp = client.get(reverse(url, args=[episode.learning_resource.id]))

    assert resp.data.get("readable_id") == episode.learning_resource.readable_id
    assert (
        resp.data.get("podcast_episode")
        == PodcastEpisodeSerializer(instance=episode).data
    )


@pytest.mark.parametrize(
    "url", ["lr:v1:learning_resource_items_api-list", "lr:v1:podcast_items_api-list"]
)
def test_get_podcast_items_endpoint(client, url):
    """Test podcast items endpoint"""
    podcast = PodcastFactory.create()

    # this should be filtered out
    podcast.learning_resource.resources.add(
        PodcastEpisodeFactory.create(is_unpublished=True).learning_resource,
        through_defaults={
            "relation_type": LearningResourceRelationTypes.PODCAST_EPISODES.value
        },
    )

    resp = client.get(reverse(url, args=[podcast.learning_resource.id]))

    assert resp.data.get("count") == podcast.learning_resource.resources.count() - 1

    for idx, resource_relationship in enumerate(
        sorted(
            LearningResourceRelationship.objects.filter(
                parent_id=podcast.id, child__published=True
            ),
            key=lambda item: item.child.last_modified,
            reverse=True,
        )
    ):
        assert resp.data.get("results")[idx]["id"] == resource_relationship.id
        assert (
            resp.data.get("results")[idx]["resource"]
            == PodcastEpisodeSerializer(instance=resource_relationship.child).data
        )


@pytest.mark.parametrize(
    "data",
    [
        {"webhook_key": "fake_key", "prefix": "prefix1", "version": "live"},
        {"webhook_key": "fake_key", "prefix": "prefix2", "version": "draft"},
        {"webhook_key": "fake_key", "prefixes": "prefix1, prefix2", "version": "live"},
        {
            "webhook_key": "fake_key",
            "prefixes": ["prefix1", "prefix2"],
            "version": "live",
        },
        {"webhook_key": "fake_key", "version": "live"},
    ],
)
def test_ocw_webhook_endpoint(client, mocker, settings, data):
    """Test that the OCW webhook endpoint schedules a get_ocw_courses task"""
    settings.OCW_WEBHOOK_KEY = "fake_key"
    mock_get_ocw = mocker.patch(
        "learning_resources.views.get_ocw_courses.delay", autospec=True
    )
    assert reverse("lr:v1:ocw-next-webhook") == "/api/v1/ocw_next_webhook/"
    response = client.post(
        reverse("lr:v1:ocw-next-webhook"),
        data=data,
        headers={"Content-Type": "text/plain"},
    )

    prefix = data.get("prefix")
    prefixes = data.get("prefixes")

    expected_prefixes = [prefix] if prefix else prefixes
    if isinstance(expected_prefixes, str):
        expected_prefixes = [prefix.strip() for prefix in expected_prefixes.split(",")]

    if expected_prefixes and data.get("version") == "live":
        mock_get_ocw.assert_called_once_with(
            url_paths=expected_prefixes, force_overwrite=False
        )
        assert response.status_code == 200
        assert (
            response.data["message"]
            == f"OCW courses queued for indexing: {expected_prefixes}"
        )
    else:
        mock_get_ocw.assert_not_called()
        if data.get("version") != "live":
            assert response.data["message"] == "Not a live version, ignoring"
            assert response.status_code == 200
        else:
            assert (
                response.data["message"]
                == f"Could not determine appropriate action from request: {data}"
            )
            assert response.status_code == 400


@pytest.mark.parametrize(
    "data",
    [
        {"site_uid": "254605fe779d5edd86f55a421e82b544", "version": "live"},
        {
            "site_uid": "254605fe779d5edd86f55a421e82b544",
            "version": "live",
            "unpublished": True,
        },
        {
            "site_uid": "254605fe779d5edd86f55a421e82b544",
            "version": "draft",
            "unpublished": True,
        },
        {"site_uid": None, "version": "live", "unpublished": True},
    ],
)
@pytest.mark.parametrize("run_exists", [True, False])
def test_ocw_webhook_endpoint_unpublished(client, mocker, settings, data, run_exists):
    """Test that the OCW webhook endpoint removes an unpublished task from the search index"""
    settings.OCW_WEBHOOK_KEY = "fake_key"
    mock_delete_course = mocker.patch(
        "learning_resources.views.resource_unpublished_actions", autospec=True
    )
    run_id = data.get("site_uid")
    course_run = None
    if run_id and run_exists:
        course_run = LearningResourceRunFactory.create(
            run_id=run_id,
            learning_resource=CourseFactory.create(
                platform=PlatformType.ocw.name
            ).learning_resource,
        )
    response = client.post(
        reverse("lr:v1:ocw-next-webhook"),
        data={"webhook_key": "fake_key", **data},
        headers={"Content-Type": "text/plain"},
    )

    if (
        data.get("site_uid")
        and data.get("unpublished") is True
        and data.get("version") == "live"
    ):
        assert response.status_code == 200
        if run_exists:
            mock_delete_course.assert_called_once_with(course_run.learning_resource)
            assert (
                response.data["message"]
                == f"OCW course {run_id} queued for unpublishing"
            )
        else:
            assert (
                response.data["message"]
                == f"OCW course {run_id} not found, so nothing to unpublish"
            )
    else:
        mock_delete_course.assert_not_called()


def test_ocw_webhook_endpoint_bad_key(settings, client):
    """Test that a webhook exception is raised if a bad key is sent"""
    settings.OCW_WEBHOOK_KEY = "fake_key"
    with pytest.raises(WebhookException):
        client.post(
            reverse("lr:v1:ocw-next-webhook"),
            data={"webhook_key": "bad_key", "prefix": "prefix", "version": "live"},
            headers={"Content-Type": "text/plain"},
        )


def test_topics_list_endpoint(client):
    """Test topics list endpoint"""
    topics = sorted(
        LearningResourceTopicFactory.create_batch(3),
        key=lambda topic: topic.name,
    )

    resp = client.get(reverse("lr:v1:topics_api-list"))
    assert resp.data.get("count") == 3
    for i in range(3):
        assert (
            resp.data.get("results")[i]
            == LearningResourceTopicSerializer(instance=topics[i]).data
        )


def test_topics_detail_endpoint(client):
    """Test topics detail endpoint"""
    topic = LearningResourceTopicFactory.create()
    resp = client.get(reverse("lr:v1:topics_api-detail", args=[topic.pk]))
    assert resp.data == LearningResourceTopicSerializer(instance=topic).data


def test_departments_list_endpoint(client):
    """Test departments list endpoint"""
    departments = sorted(
        LearningResourceDepartmentFactory.create_batch(3),
        key=lambda department: department.department_id,
    )

    resp = client.get(reverse("lr:v1:departments_api-list"))
    assert resp.data.get("count") == 3
    for i in range(3):
        assert (
            resp.data.get("results")[i]
            == LearningResourceDepartmentSerializer(instance=departments[i]).data
        )


def test_departments_detail_endpoint(client):
    """Test departments detail endpoint"""
    department = LearningResourceDepartmentFactory.create(
        department_id="ABC", name="Alpha Beta Charlie"
    )

    for dept_id in ("abc", "aBc", "ABC"):
        resp = client.get(reverse("lr:v1:departments_api-detail", args=[dept_id]))
        assert (
            resp.data == LearningResourceDepartmentSerializer(instance=department).data
        )


def test_schools_list_endpoint(client):
    """Test schools list endpoint"""
    schools = sorted(
        [dept.school for dept in LearningResourceDepartmentFactory.create_batch(3)],
        key=lambda school: school.id,
    )

    resp = client.get(reverse("lr:v1:schools_api-list"))
    assert resp.data.get("count") == 3
    for i in range(3):
        assert resp.data.get("results")[i] == {
            "id": schools[i].id,
            "name": schools[i].name,
            "url": schools[i].url,
            "departments": [
                {
                    "department_id": dept.department_id,
                    "name": dept.name,
                    "channel_url": None,
                }
                for dept in schools[i].departments.all().order_by("department_id")
            ],
        }


def test_schools_detail_endpoint(client):
    """Test schools detail endpoint"""
    department = LearningResourceDepartmentFactory.create(
        department_id="ABC", name="Alpha Beta Charlie"
    )

    for dept_id in ("abc", "aBc", "ABC"):
        resp = client.get(reverse("lr:v1:departments_api-detail", args=[dept_id]))
        assert (
            resp.data == LearningResourceDepartmentSerializer(instance=department).data
        )


def test_platforms_list_endpoint(client):
    """Test platforms list endpoint"""
    platforms = sorted(
        [
            LearningResourcePlatformFactory.create(code=code)
            for code in PlatformType.names()
        ],
        key=lambda platform: platform.code,
    )

    resp = client.get(reverse("lr:v1:platforms_api-list"))
    assert resp.data.get("count") == len(platforms)
    for i in range(3):
        assert (
            resp.data.get("results")[i]
            == LearningResourcePlatformSerializer(instance=platforms[i]).data
        )


def test_platforms_detail_endpoint(client):
    """Test platforms detail endpoint"""
    platform = LearningResourcePlatformFactory.create()

    resp = client.get(reverse("lr:v1:platforms_api-detail", args=[platform.pk]))
    assert resp.data == LearningResourcePlatformSerializer(instance=platform).data


def test_offerors_list_endpoint(client):
    """Test offerors list endpoint"""
    offerors = sorted(
        [
            LearningResourceOfferorFactory.create(code=code)
            for code in OfferedBy.names()
        ],
        key=lambda offeror: offeror.code,
    )

    resp = client.get(reverse("lr:v1:offerors_api-list"))
    assert resp.data.get("count") == len(offerors)
    for i in range(3):
        assert (
            resp.data.get("results")[i]
            == LearningResourceOfferorDetailSerializer(instance=offerors[i]).data
        )


def test_offerors_detail_endpoint(client):
    """Test offerors detail endpoint"""
    offeror = LearningResourceOfferorFactory.create()

    resp = client.get(reverse("lr:v1:offerors_api-detail", args=[offeror.code]))
    assert resp.data == LearningResourceOfferorDetailSerializer(instance=offeror).data


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:video_playlists_api-list", ""),
        ("lr:v1:learning_resources_api-list", "resource_type=video_playlist"),
    ],
)
def test_list_video_playlist_endpoint(client, url, params):
    """Test video playlist endpoint"""
    playlists = sorted(
        VideoPlaylistFactory.create_batch(2), key=lambda resource: resource.id
    )

    # this should be filtered out
    VideoPlaylistFactory.create_batch(5, is_unpublished=True)

    resp = client.get(f"{reverse(url)}?{params}")
    assert resp.data.get("count") == 2

    for idx, playlist in enumerate(playlists):
        assert resp.data.get("results")[idx]["id"] == playlist.learning_resource.id
        assert (
            resp.data.get("results")[idx]["video_playlist"]
            == VideoPlaylistSerializer(instance=playlist).data
        )


@pytest.mark.parametrize(
    "url", ["lr:v1:video_playlists_api-detail", "lr:v1:learning_resources_api-detail"]
)
def test_get_video_playlist_detail_endpoint(client, url):
    """Test video playlist detail endpoint"""
    playlist = VideoPlaylistFactory.create()

    resp = client.get(reverse(url, args=[playlist.learning_resource.id]))

    assert resp.data.get("readable_id") == playlist.learning_resource.readable_id
    assert (
        resp.data.get("video_playlist")
        == VideoPlaylistSerializer(instance=playlist).data
    )


@pytest.mark.parametrize(
    "url",
    ["lr:v1:learning_resource_items_api-list", "lr:v1:video_playlist_items_api-list"],
)
def test_get_video_playlist_items_endpoint(client, url):
    """Test video playlist items endpoint"""
    playlist = VideoPlaylistFactory.create().learning_resource
    videos = VideoFactory.create_batch(2)
    playlist.resources.set(
        [video.learning_resource for video in videos],
        through_defaults={
            "relation_type": LearningResourceRelationTypes.PLAYLIST_VIDEOS
        },
    )
    assert playlist.resources.count() > 0

    # this should be filtered out
    playlist.resources.add(
        VideoFactory.create(is_unpublished=True).learning_resource,
        through_defaults={
            "relation_type": LearningResourceRelationTypes.PLAYLIST_VIDEOS.value
        },
    )

    resp = client.get(reverse(url, args=[playlist.id]))

    assert resp.data.get("count") == playlist.resources.count() - 1

    for idx, resource_relationship in enumerate(
        sorted(
            LearningResourceRelationship.objects.filter(
                parent_id=playlist.id, child__published=True
            ),
            key=lambda item: item.child.last_modified,
            reverse=True,
        )
    ):
        assert resp.data.get("results")[idx]["id"] == resource_relationship.id
        assert (
            resp.data.get("results")[idx]["resource"]
            == VideoResourceSerializer(instance=resource_relationship.child).data
        )


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:videos_api-list", ""),
        ("lr:v1:learning_resources_api-list", "resource_type=video"),
    ],
)
def test_list_video_endpoint(client, url, params):
    """Test video endpoint"""
    videos = sorted(VideoFactory.create_batch(2), key=lambda resource: resource.id)

    # this should be filtered out
    VideoFactory.create_batch(5, is_unpublished=True)

    resp = client.get(f"{reverse(url)}?{params}")
    assert resp.data.get("count") == 2

    for idx, video in enumerate(videos):
        assert resp.data.get("results")[idx]["id"] == video.learning_resource.id
        assert (
            resp.data.get("results")[idx]["video"]
            == VideoSerializer(instance=video).data
        )


@pytest.mark.parametrize(
    "url", ["lr:v1:videos_api-detail", "lr:v1:learning_resources_api-detail"]
)
def test_get_video_detail_endpoint(client, url):
    """Test video detail endpoint"""
    video = VideoFactory.create()

    resp = client.get(reverse(url, args=[video.learning_resource.id]))

    assert resp.data.get("readable_id") == video.learning_resource.readable_id
    assert resp.data.get("video") == VideoSerializer(instance=video).data


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:courses_api-list", "sortby=new"),
        (
            "lr:v1:learning_resources_api-list",
            "sortby=new&resource_type=course",
        ),
    ],
)
def test_sortby_new(client, url, params):
    """Test new courses endpoint"""
    courses = sorted(
        CourseFactory.create_batch(3),
        key=lambda course: course.learning_resource.created_on,
        reverse=True,
    )

    resp = client.get(f"{reverse(url)}?{params}")

    assert resp.data.get("count") == 3
    assert len(resp.data.get("results")) == 3

    for i in range(3):
        assert resp.data.get("results")[i]["id"] == courses[i].learning_resource.id


@pytest.mark.parametrize(
    ("url", "params"),
    [
        ("lr:v1:courses_api-list", "sortby=upcoming"),
        ("lr:v1:learning_resources_api-list", "sortby=upcoming&resource_type=course"),
    ],
)
def test_sortby_upcoming(client, url, params):
    """Test upcoming courses endpoint"""
    other_learning_resource = LearningResourceFactory.create(
        is_course=True, next_start_date=None
    )

    later_upcoming_learning_resource = LearningResourceFactory.create(
        is_course=True, next_start_date=timezone.now() + timedelta(2)
    )

    upcoming_learning_resource = LearningResourceFactory.create(
        is_course=True, next_start_date=timezone.now() + timedelta(1)
    )

    resp = client.get(f"{reverse(url)}?{params}")
    assert resp.data.get("count") == 3
    assert len(resp.data.get("results")) == 3
    assert resp.data.get("results")[0]["id"] == upcoming_learning_resource.id
    assert resp.data.get("results")[1]["id"] == later_upcoming_learning_resource.id
    assert resp.data.get("results")[2]["id"] == other_learning_resource.id


@pytest.mark.parametrize("resource_type", ["course", "program"])
def test_popular_sort(client, resource_type):
    """Test the popular endpoints to ensure they return data correctly."""

    resources = LearningResourceFactory.create_batch(5, resource_type=resource_type)

    for resource in resources:
        LearningResourceViewEventFactory.create_batch(
            random.randrange(0, 30),  # noqa: S311
            learning_resource=resource,
        )

    url = reverse("lr:v1:learning_resources_api-list")

    params = (
        f"resource_type={resource_type}&sortby=-views"
        if resource_type
        else "sortby=-views"
    )

    resp = client.get(f"{url}?{params}")

    assert resp.data.get("count") == 5
    assert len(resp.data.get("results")) == 5

    for i in range(1, 5):
        assert (
            resp.data.get("results")[i - 1]["views"]
            >= resp.data.get("results")[i]["views"]
        )


def test_featured_view(client, offeror_featured_lists):
    """The featured api endpoint should return resources in expected order"""
    url = reverse("lr:v1:featured_api-list")
    resp = client.get(f"{url}?limit=12")
    assert resp.data.get("count") == 15
    assert len(resp.data.get("results")) == 12
    # Should get 1st resource from every featured list, then 2nd, etc.
    for idx, resource in enumerate(resp.data.get("results")):
        position = int(idx / 5)  # 5 featured offerors: 0,0,0,0,0,1,1,1,1,1,2,2
        offeror = LearningResourceOfferor.objects.get(
            code=resource["offered_by"]["code"]
        )
        featured_list = FieldChannel.objects.get(
            offeror_detail__offeror=offeror
        ).featured_list
        assert featured_list.children.all()[position].child.id == resource["id"]


@pytest.mark.parametrize("parameter", ["certification", "free", "professional"])
def test_featured_view_filter(client, offeror_featured_lists, parameter):
    """The featured api endpoint should return resources that match the filter"""
    url = reverse("lr:v1:featured_api-list")
    resp = client.get(f"{url}?{parameter}=true")
    assert len(resp.data.get("results")) > 0
    for resource in resp.data.get("results"):
        if parameter != "free":
            assert resource[parameter] is True
        else:
            for run in resource["runs"]:
                assert run["prices"] == []
