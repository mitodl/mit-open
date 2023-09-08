"""Task helper tests"""
# pylint: disable=redefined-outer-name,unused-argument
import pytest

from course_catalog.constants import UserListType
from course_catalog.factories import (
    ContentFileFactory,
    CourseFactory,
    PodcastEpisodeFactory,
    PodcastFactory,
    ProgramFactory,
    UserListFactory,
    VideoFactory,
)
from open_discussions.features import INDEX_UPDATES
from search.api import (
    gen_course_id,
    gen_podcast_episode_id,
    gen_podcast_id,
    gen_profile_id,
    gen_user_list_id,
    gen_video_id,
)
from search.constants import (
    COURSE_TYPE,
    PODCAST_EPISODE_TYPE,
    PODCAST_TYPE,
    PROFILE_TYPE,
    USER_LIST_TYPE,
    VIDEO_TYPE,
)
from search.search_index_helpers import (
    deindex_course,
    deindex_podcast,
    deindex_podcast_episode,
    deindex_profile,
    deindex_run_content_files,
    deindex_user_list,
    deindex_video,
    index_run_content_files,
    upsert_content_file,
    upsert_course,
    upsert_podcast,
    upsert_podcast_episode,
    upsert_profile,
    upsert_program,
    upsert_user_list,
    upsert_video,
)

es_profile_serializer_data = {
    "object_type": PROFILE_TYPE,
    "author_id": "testuser",
    "author_name": "Test User",
    "author_avatar_small": "/media/profiles/testuser/asd344/small.jpg",
    "author_avatar_medium": "/media/profiles/testuser/asd344/medium.jpg",
    "author_bio": "Test bio",
    "author_headline": "Test headline",
    "author_channel_membership": "channel01,channel02",
}


@pytest.fixture(autouse=True)
def enable_index_update_feature(settings):  # noqa: PT004
    """Enables the INDEX_UPDATES feature by default"""  # noqa: D401
    settings.FEATURES[INDEX_UPDATES] = True


@pytest.fixture()
def mock_es_profile_serializer(mocker):  # noqa: PT004
    """Mock OSProfileSerializer with canned serialized data"""
    mocker.patch(
        "search.tasks.OSProfileSerializer.serialize",
        autospec=True,
        return_value=es_profile_serializer_data,
    )


def test_upsert_profile(mocker, mock_es_profile_serializer, user):
    """
    Tests that upsert_profile calls the task with the right parameters
    """
    patched_task = mocker.patch("search.search_index_helpers.tasks.upsert_profile")
    upsert_profile(user.profile.id)
    patched_task.assert_called_once_with(user.profile.id)


@pytest.mark.django_db()
def test_upsert_course(mocker):
    """
    Tests that upsert_course calls update_field_values_by_query with the right parameters
    """
    patched_task = mocker.patch("search.tasks.upsert_course")
    course = CourseFactory.create()
    upsert_course(course.id)
    patched_task.assert_called_once_with(course.id)


@pytest.mark.django_db()
def test_delete_course(mocker):
    """
    Tests that deindex_course calls the delete tasks for the course and its content files
    """
    mock_del_document = mocker.patch("search.search_index_helpers.deindex_document")
    mock_bulk_del = mocker.patch(
        "search.search_index_helpers.deindex_run_content_files"
    )
    course = CourseFactory.create()
    course_es_id = gen_course_id(course.platform, course.course_id)

    deindex_course(course)
    mock_del_document.assert_called_once_with(course_es_id, COURSE_TYPE)
    for run in course.runs.iterator():
        mock_bulk_del.assert_any_call(run.id)


@pytest.mark.django_db()
def test_delete_profile(mocker, user):
    """Tests that deleting a user triggers a delete on a profile document"""
    patched_delete_task = mocker.patch("search.search_index_helpers.deindex_document")
    deindex_profile(user)
    assert patched_delete_task.called is True
    assert patched_delete_task.call_args[0] == (
        gen_profile_id(user.username),
        PROFILE_TYPE,
    )


@pytest.mark.django_db()
def test_upsert_program(mocker):
    """
    Tests that upsert_program calls update_field_values_by_query with the right parameters
    """
    patched_task = mocker.patch("search.tasks.upsert_program")
    program = ProgramFactory.create()
    upsert_program(program.id)
    patched_task.assert_called_once_with(program.id)


@pytest.mark.django_db()
def test_upsert_video(mocker):
    """
    Tests that upsert_video calls update_field_values_by_query with the right parameters
    """
    patched_task = mocker.patch("search.tasks.upsert_video")
    video = VideoFactory.create()
    upsert_video(video.id)
    patched_task.assert_called_once_with(video.id)


@pytest.mark.django_db()
def test_delete_video(mocker):
    """Tests that deleting a video triggers a delete on a video document"""
    patched_delete_task = mocker.patch("search.search_index_helpers.deindex_document")
    video = VideoFactory.create()
    deindex_video(video)
    assert patched_delete_task.called is True
    assert patched_delete_task.call_args[0] == (gen_video_id(video), VIDEO_TYPE)


@pytest.mark.django_db()
@pytest.mark.parametrize(
    "list_type", [UserListType.LIST.value, UserListType.LEARNING_PATH.value]
)
def test_upsert_user_list(mocker, list_type):
    """
    Tests that upsert_user_list calls update_field_values_by_query with the right parameters
    """
    patched_task = mocker.patch("search.tasks.upsert_user_list")
    user_list = UserListFactory.create(list_type=list_type)
    upsert_user_list(user_list.id)
    patched_task.assert_called_once_with(user_list.id)


@pytest.mark.django_db()
@pytest.mark.parametrize(
    "list_type", [UserListType.LIST.value, UserListType.LEARNING_PATH.value]
)
def test_delete_user_list(mocker, list_type):
    """Tests that deleting a UserList triggers a delete on a UserList document"""
    patched_delete_task = mocker.patch("search.search_index_helpers.deindex_document")
    user_list = UserListFactory.create(list_type=list_type)
    deindex_user_list(user_list)
    assert patched_delete_task.called is True
    assert patched_delete_task.call_args[0] == (
        gen_user_list_id(user_list),
        USER_LIST_TYPE,
    )


@pytest.mark.django_db()
def test_upsert_content_file(mocker):
    """
    Tests that upsert_content_file calls the correct celery task with parameters
    """
    patched_task = mocker.patch("search.tasks.upsert_content_file")
    content_file = ContentFileFactory.create()
    upsert_content_file(content_file.id)
    patched_task.assert_called_once_with(content_file.id)


@pytest.mark.django_db()
def test_index_run_content_files(mocker):
    """
    Tests that index_run_content_files calls the correct celery task w/parameter
    """
    patched_task = mocker.patch("search.tasks.index_run_content_files")
    content_file = ContentFileFactory.create()
    index_run_content_files(content_file.id)
    patched_task.assert_called_once_with(content_file.id)


@pytest.mark.django_db()
def test_delete_run_content_files(mocker):
    """Tests that deindex_run_content_files triggers the correct ES delete task"""
    patched_task = mocker.patch("search.tasks.deindex_run_content_files")
    content_file = ContentFileFactory.create()
    deindex_run_content_files(content_file.id)
    patched_task.assert_called_once_with(content_file.id)


@pytest.mark.django_db()
def test_upsert_podcast(mocker):
    """
    Tests that upsert_podcast calls search.tasks.upsert_podcast with the right parameters
    """
    patched_task = mocker.patch("search.tasks.upsert_podcast")
    podcast = PodcastFactory.create()
    upsert_podcast(podcast.id)
    patched_task.assert_called_once_with(podcast.id)


@pytest.mark.django_db()
def test_upsert_podcast_episode(mocker):
    """
    Tests that upsert_podcast_episode calls search.tasks.upsert_podcast_episode with the right parameters
    """
    patched_task = mocker.patch("search.tasks.upsert_podcast_episode")
    episode = PodcastFactory.create()
    upsert_podcast_episode(episode.id)
    patched_task.assert_called_once_with(episode.id)


@pytest.mark.django_db()
def test_delete_podcast(mocker):
    """Tests that deleting a podcast triggers the correct ES delete task"""
    patched_delete_task = mocker.patch("search.search_index_helpers.deindex_document")
    podcast = PodcastFactory.create()
    deindex_podcast(podcast)
    assert patched_delete_task.called is True
    assert patched_delete_task.call_args[0] == (
        gen_podcast_id(podcast),
        PODCAST_TYPE,
    )


@pytest.mark.django_db()
def test_delete_podcast_episode(mocker):
    """Tests that deleting a podcast episode triggers the correct ES delete task"""
    patched_delete_task = mocker.patch("search.search_index_helpers.deindex_document")
    episode = PodcastEpisodeFactory.create()
    deindex_podcast_episode(episode)
    assert patched_delete_task.called is True
    assert patched_delete_task.call_args[0] == (
        gen_podcast_episode_id(episode),
        PODCAST_EPISODE_TYPE,
    )
