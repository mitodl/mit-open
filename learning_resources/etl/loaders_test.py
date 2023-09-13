"""Tests for ETL loaders"""
# pylint: disable=redefined-outer-name,too-many-locals,too-many-lines
from types import SimpleNamespace

import pytest
from django.forms.models import model_to_dict

from learning_resources.constants import (
    LearningResourceType,
    PlatformType,
)
from learning_resources.etl.exceptions import ExtractException
from learning_resources.etl.loaders import (
    load_playlist,
    load_playlists,
    load_video,
    load_video_channels,
    load_videos,
)
from learning_resources.factories import (
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
    LearningResourceTopicFactory,
    PlaylistFactory,
    VideoChannelFactory,
    VideoFactory,
)
from learning_resources.models import (
    LearningResource,
    Playlist,
    PlaylistVideo,
    Video,
    VideoChannel,
)

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def youtube_video_platform():
    """Fixture for a youtube video platform"""
    return LearningResourcePlatformFactory.create(platform=PlatformType.youtube.value)


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


@pytest.mark.parametrize("video_exists", [True, False])
@pytest.mark.parametrize("is_published", [True, False])
@pytest.mark.parametrize("pass_topics", [True, False])
def test_load_video(mocker, mock_upsert_tasks, video_exists, is_published, pass_topics):
    """Test that load_video loads the video"""
    video_resource = (
        VideoFactory.create(is_unpublished=not is_published)
        if video_exists
        else VideoFactory.build()
    ).learning_resource
    offered_bys = LearningResourceOfferorFactory.create_batch(3)
    topics = LearningResourceTopicFactory.create_batch(3)
    passed_topics = LearningResourceTopicFactory.create_batch(1)
    loading_topics = [{"name": topic.name} for topic in passed_topics]
    extracted_topics = LearningResourceTopicFactory.create_batch(2)
    mocker.patch(
        "learning_resources.etl.loaders.extract_topics",
        return_value=[{"name": topic.name} for topic in extracted_topics],
    )
    expected_topics = passed_topics if pass_topics else extracted_topics
    if video_exists:
        video_resource.topics.set(topics)

    assert Video.objects.count() == (1 if video_exists else 0)

    props = {
        "readable_id": video_resource.readable_id,
        "platform": PlatformType.youtube.value,
        "resource_type": LearningResourceType.video.value,
        "title": video_resource.title,
        "description": video_resource.description,
        "full_description": video_resource.full_description,
        "image": {"url": video_resource.image.url},
        "last_modified": video_resource.last_modified,
        "url": video_resource.url,
        "offered_by": [{"name": offered_by.name} for offered_by in offered_bys],
        "published": is_published,
        "video": {"duration": video_resource.video.duration},
    }

    if pass_topics is True:
        props["topics"] = loading_topics

    result = load_video(props)
    assert Video.objects.count() == 1

    # assert we got a video resource back
    assert isinstance(result, LearningResource)
    assert result.published == is_published
    assert list(result.topics.all()) == expected_topics

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"


def test_load_videos():
    """Verify that load_videos loads a list of videos"""
    assert Video.objects.count() == 0
    video_resources = [video.learning_resource for video in VideoFactory.build_batch(5)]
    videos_data = [
        model_to_dict(video, exclude=["resource_content_tags", "resources"])
        for video in video_resources
    ]

    results = load_videos(videos_data)

    assert len(results) == len(video_resources)

    assert Video.objects.count() == len(video_resources)


def test_load_playlist():
    """Test load_playlist"""
    channel = VideoChannelFactory.create(playlists=None)
    playlist = PlaylistFactory.build()
    assert Playlist.objects.count() == 0
    assert Video.objects.count() == 0

    videos_records = VideoFactory.build_batch(5)
    videos_data = [
        model_to_dict(
            video.learning_resource, exclude=["resource_content_tags", "resources"]
        )
        for video in videos_records
    ]

    props = model_to_dict(playlist)

    del props["id"]
    del props["channel"]
    props["videos"] = videos_data

    result = load_playlist(channel, props)

    assert isinstance(result, Playlist)

    assert result.videos.count() == len(videos_records)
    assert result.channel == channel


def test_load_playlists_unpublish():
    """Test load_playlists when a video/playlist gets unpublished"""
    channel = VideoChannelFactory.create()

    playlists = PlaylistFactory.create_batch(4, channel=channel)

    playlists_data = [
        {
            "playlist_id": playlists[0].playlist_id,
            "videos": [],
        }
    ]

    load_playlists(channel, playlists_data)

    for playlist in playlists:
        playlist.refresh_from_db()
        if playlist.id == playlists[0].id:
            assert playlist.published is True
        else:
            assert playlist.published is False


def test_load_video_channels():
    """Test load_video_channels"""
    assert VideoChannel.objects.count() == 0
    assert Playlist.objects.count() == 0

    channels_data = []
    for channel in VideoChannelFactory.build_batch(3):
        channel_data = model_to_dict(channel)
        del channel_data["id"]

        playlist = PlaylistFactory.build()
        playlist_data = model_to_dict(playlist)
        del playlist_data["id"]
        del playlist_data["channel"]

        channel_data["playlists"] = [playlist_data]
        channels_data.append(channel_data)

    results = load_video_channels(channels_data)

    assert len(results) == len(channels_data)

    for result in results:
        assert isinstance(result, VideoChannel)

        assert result.playlists.count() == 1


def test_load_video_channels_error(mocker):
    """Test that an error doesn't fail the entire operation"""

    def pop_channel_id_with_exception(data):
        """Pop channel_id off data and raise an exception"""
        data.pop("channel_id")
        raise ExtractException

    mock_load_channel = mocker.patch(
        "learning_resources.etl.loaders.load_video_channel"
    )
    mock_load_channel.side_effect = pop_channel_id_with_exception
    mock_log = mocker.patch("learning_resources.etl.loaders.log")
    channel_id = "abc"

    load_video_channels([{"channel_id": channel_id}])

    mock_log.exception.assert_called_once_with(
        "Error with extracted video channel: channel_id=%s", channel_id
    )


def test_load_video_channels_unpublish(mock_upsert_tasks):
    """Test load_video_channels when a video/playlist gets unpublished"""
    channel = VideoChannelFactory.create()
    playlist = PlaylistFactory.create(channel=channel)
    video = VideoFactory.create()
    PlaylistVideo.objects.create(playlist=playlist, video=video, position=0)
    unpublished_playlist = PlaylistFactory.create(channel=channel, is_unpublished=True)
    unpublished_video = VideoFactory.create()
    PlaylistVideo.objects.create(
        playlist=unpublished_playlist, video=unpublished_video, position=0
    )

    # inputs don't matter here
    load_video_channels([])

    video.refresh_from_db()
    unpublished_video.refresh_from_db()
    assert video.learning_resource.published is True
    assert unpublished_video.learning_resource.published is False
