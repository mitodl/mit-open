"""Tests for Video ETL functions"""

# pylint: disable=redefined-outer-name
import json
from collections import defaultdict
from datetime import UTC, datetime
from glob import glob
from os.path import basename
from unittest.mock import Mock

import pytest
from googleapiclient.errors import HttpError
from youtube_transcript_api import NoTranscriptFound

from learning_resources.constants import (
    Availability,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.etl import youtube
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.exceptions import ExtractException
from learning_resources.factories import VideoFactory
from main.utils import clean_data


@pytest.fixture()
def youtube_api_responses():
    """Load the api responses"""
    mock_responses = defaultdict(list)

    # these need to be sorted() so that *.N.json files get appended in the proper order
    for pathname in sorted(glob("test_json/youtube/*.json")):  # noqa: PTH207
        mod_name, func_name, _, _ = basename(pathname).split(".")  # noqa: PTH119

        with open(pathname) as f:  # noqa: PTH123
            mock_responses[(mod_name, func_name)].append(json.load(f))

    for (mod_name, func_name), side_effects in mock_responses.items():  # noqa: B007
        if func_name == "list_next":
            # list_next() operations return None when there's no additional pages to fetch
            side_effects.append(None)

    return mock_responses


@pytest.fixture(autouse=True)
def video_settings(settings):
    """Mock for django settings"""
    settings.YOUTUBE_DEVELOPER_KEY = "key"
    settings.YOUTUBE_CONFIG_URL = "http://test.mit.edu/test.yaml"
    return settings


@pytest.fixture(autouse=True)
def mock_youtube_client(mocker, youtube_api_responses):
    """Mocks out the youtube client with static json data"""  # noqa: D401
    # each side effect should default to an empty list
    config = defaultdict(list)
    # build up a config based on filenames of the loaded responses, as an example
    # the original filename "videos.list.0.json" will create this key:
    config.update(
        {
            f"{'.return_value.'.join(key)}.return_value.execute.side_effect": value
            for key, value in youtube_api_responses.items()
        }
    )
    # append None to each of the list_next funcs so pagination terminates
    for mod in ["channels", "playlistItems", "playlists", "video"]:
        config[f"{mod}.return_value.list_next.return_value.execute.side_effect"].append(
            None
        )

    mock_client = mocker.patch("learning_resources.etl.youtube.get_youtube_client")
    mock_client.return_value.configure_mock(**config)
    return mock_client


def mock_channel(
    offered_by,
    channel_id,
    playlist_id,
):
    """Mock video channel github file"""

    return f"""
- channel_id: {channel_id}
  offered_by: {offered_by}
  playlists:
    - id: {playlist_id}"""


def mock_channel_with_wildcard(channel_id, ignore_playlist_id):
    """Mock video channel configuration with wildcard"""

    return f"""
- channel_id: {channel_id}
  offered_by: csail
  playlists:
    - id: all
    - id: {ignore_playlist_id}
      ignore: true
"""


def mock_channel_file(content):
    """Mock video channel github file"""

    return f"---{content}"


@pytest.fixture()
def mocked_github_channel_response(mocker):  # noqa: PT004
    """Mock response from github api requst to open-video-data"""

    mock_file = mock_channel_file(
        "".join(
            [
                mock_channel(
                    OfferedBy.mitx.name,
                    "UCTBMWu8yshnAmpzR3MoJFtw",
                    "PL221E2BBF13BECF6C",
                ),
                mock_channel(
                    OfferedBy.ocw.name,
                    "UCEBb1b_L6zDS3xTUrIALZOw",
                    "PLTz-v-F773kXwTSKsX_E9t8ZnP_3LYaGy",
                ),
                mock_channel_with_wildcard(
                    "UCBpxspUNl1Th33XbugiHJzw", "PLcwbNON2hqP5TFbkw0igt6Wz79WTaeFGi"
                ),
            ]
        )
    )
    mock_requests = mocker.patch("learning_resources.etl.youtube.requests")
    mock_requests.get.return_value.content = mock_file


@pytest.fixture()
def extracted_and_transformed_values(youtube_api_responses):
    # pylint: disable=too-many-locals
    """Mock data for the API responses and how they are transformed"""
    channels_list = youtube_api_responses[("channels", "list")]
    playlists_list = youtube_api_responses[("playlists", "list")]

    playlist_items_list = youtube_api_responses[("playlistItems", "list")]
    playlist_items_list_next = youtube_api_responses[("playlistItems", "list_next")]
    videos_list = youtube_api_responses[("videos", "list")]

    ocw_items = playlist_items_list[0]["items"] + playlist_items_list_next[0]["items"]
    ocw_items_order = [item["contentDetails"]["videoId"] for item in ocw_items]

    mitx_items = playlist_items_list[1]["items"]
    mitx_items_order = [item["contentDetails"]["videoId"] for item in mitx_items]

    csail_items = playlist_items_list[2]["items"]
    csail_items_order = [item["contentDetails"]["videoId"] for item in csail_items]

    # sort the videos by the order they appeared in playlistItems responses
    ocw_videos = sorted(
        videos_list[0]["items"] + videos_list[1]["items"],
        key=lambda item: ocw_items_order.index(item["id"]),
    )
    mitx_videos = sorted(
        videos_list[2]["items"], key=lambda item: mitx_items_order.index(item["id"])
    )

    csail_videos = sorted(
        videos_list[3]["items"], key=lambda item: csail_items_order.index(item["id"])
    )

    extracted = [
        (
            OfferedBy.ocw.name,
            channels_list[0]["items"][0],
            [(playlists_list[0]["items"][0], ocw_videos)],
        ),
        (
            OfferedBy.mitx.name,
            channels_list[0]["items"][1],
            [(playlists_list[1]["items"][0], mitx_videos)],
        ),
        (
            "csail",
            channels_list[0]["items"][2],
            [
                (playlists_list[2]["items"][1], csail_videos),
            ],
        ),
    ]

    transformed = [
        {
            "channel_id": channel["id"],
            "title": channel["snippet"]["title"],
            "published": True,
            "playlists": [
                {
                    "playlist_id": playlist["id"],
                    "title": playlist["snippet"]["title"],
                    "platform": PlatformType.youtube.name,
                    "etl_source": ETLSource.youtube.name,
                    "offered_by": {"code": offered_by}
                    if offered_by != "csail"
                    else None,
                    "availability": [Availability.anytime.name],
                    "published": True,
                    "videos": [
                        {
                            "readable_id": video["id"],
                            "resource_type": LearningResourceType.video.name,
                            "platform": PlatformType.youtube.name,
                            "etl_source": ETLSource.youtube.name,
                            "description": clean_data(video["snippet"]["description"]),
                            "image": {
                                "url": video["snippet"]["thumbnails"]["high"]["url"],
                            },
                            "last_modified": video["snippet"]["publishedAt"],
                            "published": True,
                            "url": f"https://www.youtube.com/watch?v={video['id']}",
                            "offered_by": {"code": offered_by}
                            if offered_by != "csail"
                            else None,
                            "title": video["snippet"]["localized"]["title"],
                            "availability": [Availability.anytime.name],
                            "video": {
                                "duration": video["contentDetails"]["duration"],
                            },
                        }
                        for video in videos
                    ],
                }
                for playlist, videos in playlists
            ],
        }
        for offered_by, channel, playlists in extracted
    ]

    return extracted, transformed


def _resolve_extracted_channels(channels):
    """Resolve the nested generator data"""
    return [
        (
            offered_by,
            channel_data,
            list(map(_resolve_extracted_playlist, playlists)),
        )
        for offered_by, channel_data, playlists in channels
    ]


def _resolve_extracted_playlist(playlist):
    """Resolve a playlist and its nested generators"""
    playlist_data, videos = playlist
    return (playlist_data, list(videos))


@pytest.fixture()
def mock_raw_caption_data():
    """Mock data for raw youtube video caption"""
    return '<?xml version="1.0" encoding="utf-8" ?><transcript><text start="0" dur="0.5"></text><text start="0.5" dur="3.36">PROFESSOR: So, now we come to\nthe place where arithmetic,</text><text start="3.86" dur="2.67">modulo n or\nremainder arithmetic,</text><text start="6.53" dur="3.05">starts to be a little bit\ndifferent and that involves</text><text start="9.58" dur="2.729">taking inverses and cancelling.</text></transcript>'


@pytest.fixture()
def mock_parsed_transcript_data():
    """Mock data for parsed video caption"""
    return "PROFESSOR: So, now we come to the place where arithmetic,\nmodulo n or remainder arithmetic,\nstarts to be a little bit different and that involves\ntaking inverses and cancelling."


def test_get_captions_for_video(mocker):
    """Test fetching caption data for a video when non auto-generated english caption is available"""
    caption_text = "English: Not Auto-generated"
    mock_captions_api = mocker.patch(
        "learning_resources.etl.youtube.YouTubeTranscriptApi.list_transcripts"
    )
    mock_captions_api.return_value.find_manually_created_transcript.return_value = Mock(
        fetch=Mock(
            return_value=[{"text": caption_text, "start": 0.608, "duration": 3.129}]
        )
    )

    video = Mock()
    assert youtube.get_captions_for_video(video) == caption_text


def test_get_captions_for_video_autogenerated_only(mocker):
    """Test fetching caption data for a video when only auto-generated english caption is available"""
    auto_text = "English: Auto-generated"
    mock_captions_api = mocker.patch(
        "learning_resources.etl.youtube.YouTubeTranscriptApi.list_transcripts"
    )
    mock_captions_api.return_value.find_manually_created_transcript.return_value = None
    mock_captions_api.return_value.find_generated_transcript.return_value = Mock(
        fetch=Mock(
            return_value=[{"text": auto_text, "start": 0.608, "duration": 3.129}]
        )
    )

    video = Mock()
    captions = youtube.get_captions_for_video(video)
    assert captions == auto_text


def test_get_captions_for_video_no_english_caption(mocker):
    """Test fetching caption data for a video with no english caption available"""
    mock_captions_api = mocker.patch(
        "learning_resources.etl.youtube.YouTubeTranscriptApi.list_transcripts"
    )
    mock_captions_api.return_value.find_manually_created_transcript.return_value = None
    mock_captions_api.return_value.find_generated_transcript.return_value = None

    video = Mock()
    assert youtube.get_captions_for_video(video) is None


def test_get_captions_for_video_no_captions(mocker):
    """Test fetching caption data for a video with no captions available"""
    mock_captions_api = mocker.patch(
        "learning_resources.etl.youtube.YouTubeTranscriptApi.list_transcripts"
    )
    mock_captions_api.side_effect = NoTranscriptFound("abc", "en", {})

    video = Mock()
    assert youtube.get_captions_for_video(video) is None


@pytest.mark.usefixtures("mock_youtube_client", "mocked_github_channel_response")
def test_extract(extracted_and_transformed_values):
    """Test that extract returns expected responses"""
    extracted, _ = extracted_and_transformed_values
    results = _resolve_extracted_channels(youtube.extract())
    assert results == extracted


@pytest.mark.parametrize(
    ("key", "url"),
    [
        (None, "https://youtube.test.edu"),
        ("key", None),
    ],
)
def test_extract_with_unset_keys(settings, key, url):
    """Test youtube video ETL extract with no keys set"""
    settings.YOUTUBE_DEVELOPER_KEY = key
    settings.YOUTUBE_CONFIG_URL = url

    assert _resolve_extracted_channels(youtube.extract()) == []


@pytest.mark.usefixtures("video_settings", "mocked_github_channel_response")
@pytest.mark.parametrize("yaml_parser_response", [None, {}, {"channels": []}])
def test_extract_with_no_channels(mocker, yaml_parser_response):
    """Test youtube video ETL extract with no channels in data"""
    mocker.patch("yaml.safe_load", return_value=yaml_parser_response)

    assert _resolve_extracted_channels(youtube.extract()) == []


@pytest.mark.django_db()
@pytest.mark.parametrize(
    ("error", "raised_exception", "message"),
    [
        (StopIteration, None, None),
        (HttpError, ExtractException, "Error fetching video_ids="),
    ],
)
def test_extract_videos_errors(error, raised_exception, message):
    """Test that extract_videos handles errors as expected"""
    client = Mock(videos=Mock(side_effect=error(Mock(), b"")))
    if raised_exception:
        with pytest.raises(raised_exception) as err:
            list(youtube.extract_videos(client, []))
        assert message in str(err)


@pytest.mark.django_db()
@pytest.mark.parametrize(
    ("error", "raised_exception", "message"),
    [
        (StopIteration, None, None),
        (HttpError, ExtractException, "Error fetching playlist items: playlist_id="),
    ],
)
def test_extract_playlist_items_errors(error, raised_exception, message):
    """Test that extract_playlist_items handles errors as expected"""
    client = Mock(playlistItems=Mock(side_effect=error(Mock(), b"")))
    if raised_exception:
        with pytest.raises(raised_exception) as err:
            list(youtube.extract_playlist_items(client, "playlist_id"))
        assert message in str(err)


@pytest.mark.django_db()
@pytest.mark.parametrize(
    ("error", "raised_exception", "message"),
    [
        (StopIteration, None, None),
        (
            HttpError,
            ExtractException,
            "Error fetching channel playlists: playlist_ids=",
        ),
    ],
)
def test_extract_playlists_errors(
    mock_youtube_client, error, raised_exception, message
):
    """Test that _extract_playlists handles errors as expected"""
    request = Mock(execute=Mock(side_effect=error(Mock(), b"")))
    if raised_exception:
        with pytest.raises(raised_exception) as err:
            list(youtube._extract_playlists(mock_youtube_client, request, {}))  # noqa: SLF001
        assert message in str(err)


@pytest.mark.django_db()
@pytest.mark.parametrize(
    ("error", "raised_exception", "message"),
    [
        (StopIteration, None, None),
        (HttpError, ExtractException, "Error fetching channels: channel_ids="),
    ],
)
def test_extract_channels_errors(error, raised_exception, message):
    """Test that extract_playlist_items handles errors as expected"""
    client = Mock(channels=Mock(side_effect=error(Mock(), b"")))
    if raised_exception:
        with pytest.raises(raised_exception) as err:
            list(youtube.extract_channels(client, [{"channel_id": "channel_id"}]))
        assert message in str(err)


def test_transform_video(extracted_and_transformed_values):
    """Test youtube transform for a video"""
    extracted, transformed = extracted_and_transformed_values
    result = youtube.transform_video(extracted[0][2][0][1][0], OfferedBy.ocw.name)
    assert result == transformed[0]["playlists"][0]["videos"][0]


@pytest.mark.parametrize("has_user_list", [True, False])
@pytest.mark.parametrize("user_list_title", ["Title", None])
def test_transform_playlist(
    extracted_and_transformed_values, has_user_list, user_list_title
):
    """Test youtube transform for a playlist"""
    extracted, transformed = extracted_and_transformed_values
    result = youtube.transform_playlist(
        extracted[0][2][0][0],
        extracted[0][2][0][1],
        OfferedBy.ocw.name,
    )
    assert {**result, "videos": list(result["videos"])} == {
        **transformed[0]["playlists"][0],
    }


def test_transform(extracted_and_transformed_values):
    """Test youtube transform"""
    extracted, transformed = extracted_and_transformed_values
    channels = youtube.transform(extracted)
    assert [
        {
            **channel,
            "playlists": [
                {**playlist, "videos": list(playlist["videos"])}
                for playlist in channel["playlists"]
            ],
        }
        for channel in channels
    ] == transformed


@pytest.mark.parametrize(
    ("config", "expected"),
    [
        (None, ["Channel configs data is empty"]),
        ([], ["Channel configs data is empty"]),
        ([10], ["Channel data should be a dict"]),
        ("a string", ["Channels data should be a list of dicts"]),
        (
            [{"channel_id": "abc", "offered_by": "org", "playlists": [{"id": "def"}]}],
            [],
        ),
        ([{"channel_id": "abc", "playlists": [{"id": "def"}]}], []),
        (
            [{"offered_by": "org"}],
            [
                "Required key 'channel_id' is not present in channel dict",
                "Required key 'playlists' is not present in channel dict",
            ],
        ),
        (
            [{"channel_id": "abc", "playlists": [{}]}],
            ["Required key 'id' not present in playlists[0]"],
        ),
    ],
)
def test_validate_channel_config(config, expected):
    """Test that validate_channel_configs returns expected errors"""
    assert youtube.validate_channel_configs(config) == expected


@pytest.mark.django_db()
@pytest.mark.usefixtures("video_settings")
def test_get_youtube_transcripts(mocker):
    """Verify that get_youtube_transcript downloads, saves and upserts video data"""
    mock_caption_parsed = "parsed"
    mock_resource = VideoFactory.create().learning_resource
    mock_update_index_call = mocker.patch("learning_resources.etl.youtube.update_index")

    mock_caption_call = mocker.patch(
        "learning_resources.etl.youtube.get_captions_for_video"
    )
    mock_caption_call.return_value = mock_caption_parsed

    youtube.get_youtube_transcripts([mock_resource])

    mock_caption_call.assert_called_once_with(mock_resource)
    mock_update_index_call.assert_called_once_with(mock_resource, newly_created=False)
    mock_resource.refresh_from_db()
    assert mock_resource.video.transcript == mock_caption_parsed


@pytest.mark.django_db()
@pytest.mark.parametrize("overwrite", [True, False])
@pytest.mark.parametrize("created_after", [datetime(2019, 10, 4, tzinfo=UTC), None])
@pytest.mark.parametrize("created_minutes", [2000, None])
def test_get_youtube_videos_for_transcripts_job(
    overwrite, created_after, created_minutes
):
    """Verify that get_youtube_videos_for_transcripts_job applies filters correctly"""

    video1 = VideoFactory.create(transcript="saved already").learning_resource
    video2 = VideoFactory.create(transcript="").learning_resource
    video3 = VideoFactory.create(transcript="saved already").learning_resource
    video3.created_on = datetime(2019, 10, 1, tzinfo=UTC)
    video3.save()
    video4 = VideoFactory.create(transcript="").learning_resource
    video4.created_on = datetime(2019, 10, 1, tzinfo=UTC)
    video4.save()
    video5 = VideoFactory.create(transcript="saved already").learning_resource
    video5.created_on = datetime(2019, 10, 5, tzinfo=UTC)
    video5.save()
    video6 = VideoFactory.create(transcript="").learning_resource
    video6.created_on = datetime(2019, 10, 5, tzinfo=UTC)
    video6.save()

    result = youtube.get_youtube_videos_for_transcripts_job(
        created_after=created_after,
        created_minutes=created_minutes,
        overwrite=overwrite,
    )

    if overwrite:
        if created_after:
            assert list(result.order_by("video__id")) == [
                video1,
                video2,
                video5,
                video6,
            ]
        elif created_minutes:
            assert list(result.order_by("video__id")) == [video1, video2]
        else:
            assert list(result.order_by("video__id")) == [
                video1,
                video2,
                video3,
                video4,
                video5,
                video6,
            ]
    else:  # noqa: PLR5501
        if created_after:
            assert list(result.order_by("video__id")) == [video2, video6]
        elif created_minutes:
            assert list(result.order_by("video__id")) == [video2]
        else:
            assert list(result.order_by("video__id")) == [video2, video4, video6]
