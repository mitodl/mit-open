"""video catalog ETL"""
import logging
import time
from datetime import timedelta
from html import unescape
from urllib.error import HTTPError
from xml.etree import ElementTree

import github
import googleapiclient.errors
import pytube
import yaml
from django.conf import settings
from googleapiclient.discovery import build

from learning_resources.constants import LearningResourceType, PlatformType
from learning_resources.etl.exceptions import (
    ExtractPlaylistException,
    ExtractPlaylistItemException,
    ExtractVideoException,
)
from learning_resources.models import LearningResource
from open_discussions.utils import now_in_utc

CONFIG_FILE_REPO = "mitodl/open-video-data"
CONFIG_FILE_FOLDER = "youtube"
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"
WILDCARD_PLAYLIST_ID = "all"

log = logging.getLogger()


def get_youtube_client():
    """
    Function to generate a Google api client

    Returns:
        Google Api client object
    """  # noqa: D401

    developer_key = settings.YOUTUBE_DEVELOPER_KEY
    return build(
        YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=developer_key
    )


def extract_videos(youtube_client, video_ids):
    """
    Function which returns a generator that loops through a list of video ids and returns video data

    Args:
        youtube_client (object): Youtube api client
        video_ids (list of str): video ids

    Returns:
        A generator that yields video data
    """  # noqa: D401, E501
    video_ids = list(video_ids)
    try:
        request = youtube_client.videos().list(
            part="snippet,contentDetails", id=",".join(video_ids)
        )
        response = request.execute()

        # yield items in the order in which they were passed in so the playlist order is correct  # noqa: E501
        yield from sorted(
            response["items"], key=lambda item: video_ids.index(item["id"])
        )
    except StopIteration:
        return
    except googleapiclient.errors.HttpError as exc:
        msg = f"Error fetching video_ids={video_ids}"
        raise ExtractVideoException(msg) from exc


def extract_playlist_items(youtube_client, playlist_id):
    """
    Extract a playlist's items

    Args:
        youtube_client (object): Youtube api client
        playlist_id (str): Youtube's id for a playlist

    Returns:
        A generator that yields video data
    """

    try:
        request = youtube_client.playlistItems().list(
            part="contentDetails", maxResults=50, playlistId=playlist_id
        )

        while request is not None:
            response = request.execute()

            if response is None:
                break

            video_ids = (
                item["contentDetails"]["videoId"] for item in response["items"]
            )  # noqa: E501, RUF100

            yield from extract_videos(youtube_client, video_ids)

            request = youtube_client.playlistItems().list_next(request, response)

    except StopIteration:
        return
    except googleapiclient.errors.HttpError as exc:
        msg = f"Error fetching playlist items: playlist_id={playlist_id}"
        raise ExtractPlaylistItemException(msg) from exc


def _extract_playlists(youtube_client, request, playlist_configs):
    """
    Extract a list of playlists

    Args:
        youtube_client (object): Youtube api client
        playlist_configs (list of dict): list of playlist configurations

    Returns:
        A generator that yields playlist data
    """
    try:
        while request is not None:
            response = request.execute()

            if response is None:
                break

            for playlist_data in response["items"]:
                playlist_id = playlist_data["id"]

                if playlist_id in playlist_configs:
                    playlist_config = playlist_configs[playlist_id]
                else:
                    playlist_config = playlist_configs[WILDCARD_PLAYLIST_ID]

                if not playlist_config.get("ignore", False):
                    yield (
                        playlist_data,
                        extract_playlist_items(youtube_client, playlist_id),
                    )

            request = youtube_client.playlists().list_next(request, response)
    except StopIteration:
        return
    except googleapiclient.errors.HttpError as exc:
        playlist_ids = ", ".join(list(playlist_configs.keys()))
        msg = f"Error fetching channel playlists: playlist_ids={playlist_ids}"
        raise ExtractPlaylistException(msg) from exc


def extract_playlists(youtube_client, playlist_configs, channel_id, upload_playlist_id):
    """
    Extract a list of playlists for a channel
    Args:
        youtube_client (object): Youtube api client
        playlist_configs (list of dict): list of playlist configurations
        channel_id (str): youtube's id for the channel
        upload_playlist_id (str): youtube's upload playlist id  for the channel
    Returns:
        A generator that yields playlist data
    """

    playlist_configs_by_id = {
        playlist_config["id"]: playlist_config for playlist_config in playlist_configs
    }

    requests = []

    if WILDCARD_PLAYLIST_ID in playlist_configs_by_id:
        # The upload playlist is not included in the playlists by channel id response
        if not (
            upload_playlist_id in playlist_configs_by_id
            and playlist_configs_by_id[upload_playlist_id].get("ignore", False)
        ):
            requests.append(
                youtube_client.playlists().list(part="snippet", id=upload_playlist_id)
            )

        requests.append(
            youtube_client.playlists().list(
                part="snippet", channelId=channel_id, maxResults=50
            )
        )

    else:
        playlist_ids = playlist_configs_by_id.keys()
        requests.append(
            youtube_client.playlists().list(
                part="snippet", id=",".join(playlist_ids), maxResults=50
            )
        )

    for request in requests:
        yield from _extract_playlists(youtube_client, request, playlist_configs_by_id)


def extract_channels(youtube_client, channels_config):
    """
    Extract a list of channels

    Args:
        youtube_client (object): Youtube api client
        channels_config (list of dict): list of channel configurations

    Returns:
        A generator that yields channel data
    """
    channel_configs_by_ids = {item["channel_id"]: item for item in channels_config}
    channel_ids = set(channel_configs_by_ids.keys())

    if not channel_ids:
        return

    try:
        request = youtube_client.channels().list(
            part="snippet,contentDetails", id=",".join(channel_ids), maxResults=50
        )

        while request is not None:
            response = request.execute()

            if response is None:
                break

            for channel_data in response["items"]:
                channel_id = channel_data["id"]
                upload_playlist_id = channel_data["contentDetails"]["relatedPlaylists"][
                    "uploads"
                ]
                channel_config = channel_configs_by_ids[channel_id]
                offered_by = channel_config.get("offered_by", None)
                playlist_configs = channel_config.get("playlists", [])

                # if we hit any error on a playlist, we simply abort
                playlists = extract_playlists(
                    youtube_client, playlist_configs, channel_id, upload_playlist_id
                )
                yield (offered_by, channel_data, playlists)

            request = youtube_client.channels().list_next(request, response)
    except StopIteration:
        return
    except googleapiclient.errors.HttpError:
        log.exception("Error fetching channels: channel_ids=%s", channel_ids)


def get_captions_for_video(video_resource: LearningResource):
    """
    Function which fetches and returns xml captions for a video object

    Args:
        video_resource (learning_resources.models.LearningResource)

    Returns:
        str: transcript in xml format

    """  # noqa: D401
    pytube_client = pytube.YouTube(video_resource.url)
    all_captions = pytube_client.captions.all()

    english_captions = [caption for caption in all_captions if caption.code == "en"]
    # sort auto-generated captions to the bottom of the list
    sorted_captions = sorted(
        english_captions, key=lambda caption: "auto-generated" in caption.name
    )

    return sorted_captions[0].xml_captions if sorted_captions else None


def parse_video_captions(xml_captions):
    """
    Function which parses xml captions and returns a string with just the transcript

    Args:
        xml_captions (str): Caption as xml with text and timestamps

    Returns:
        str: transcript with timestamps removed

    """  # noqa: D401

    if not xml_captions:
        return ""

    captions_list = []
    root = ElementTree.fromstring(xml_captions)  # noqa: S314

    for child in root.iter():
        text = child.text or ""
        text = unescape(text.replace("\n", " ").replace("  ", " "))

        if text:
            captions_list.append(text)

    return "\n".join(captions_list)


def github_youtube_config_files():
    """
    Function that returns a list of pyGithub files with youtube config channel data

    Returns:
        A list of pyGithub contentFile objects
    """  # noqa: D401

    if settings.GITHUB_ACCESS_TOKEN:
        github_client = github.Github(settings.GITHUB_ACCESS_TOKEN)
    else:
        github_client = github.Github()

    repo = github_client.get_repo(CONFIG_FILE_REPO)

    return repo.get_contents(CONFIG_FILE_FOLDER, ref=settings.OPEN_VIDEO_DATA_BRANCH)


def validate_channel_config(channel_config):
    """
    Validates a channel config

    Args:
        channel_config (dict):
            the channel config object

    Returns:
        list of str:
            list of errors or an empty list if no errors
    """  # noqa: D401
    errors = []

    if not channel_config:
        errors.append("Channel config data is empty")
        return errors

    if not isinstance(channel_config, dict):
        errors.append("Channel data should be a dict")
        return errors

    for required_key in ["playlists", "channel_id"]:
        if required_key not in channel_config:
            errors.append(  # noqa: PERF401
                f"Required key '{required_key}' is not present"
            )  # noqa: PERF401, RUF100

    for idx, playlist_config in enumerate(channel_config.get("playlists", [])):
        if "id" not in playlist_config:
            errors.append(f"Required key 'id' not present in playlists[{idx}]")

    return errors


def get_youtube_channel_configs(*, channel_ids=None):
    """
    Fetch youtube channel configs from github

    Args:
        channel_ids (list of str):
            list of channel ids to filter the configs

    Returns:
        list of dict:
            a list of configuration objects
    """
    channel_configs = []

    for file in github_youtube_config_files():
        try:
            channel_config = yaml.safe_load(file.decoded_content)

            errors = validate_channel_config(channel_config)

            if errors:
                log.error(
                    "Invalid youtube channel config for path=%s errors=%s",
                    file.path,
                    errors,
                )
            elif not channel_ids or channel_config["channel_id"] in channel_ids:
                channel_configs.append(channel_config)
        except yaml.scanner.ScannerError:
            log.exception("Error parsing youtube channel config for path=%s", file.path)
            continue

    return channel_configs


def extract(*, channel_ids=None):
    """
    Function which returns video data for all videos in our watched playlists

    Args:
        channel_ids (list of str or None): if a list the extraction is limited to those channels

    Returns:
        A generator that yields tuples with offered_by and video data
    """  # noqa: D401, E501
    if not settings.YOUTUBE_DEVELOPER_KEY:
        log.error("Missing YOUTUBE_DEVELOPER_KEY")
        return

    youtube_client = get_youtube_client()
    channels_config = get_youtube_channel_configs(channel_ids=channel_ids)

    yield from extract_channels(youtube_client, channels_config)


def transform_video(video_data, offered_by):
    """
    Transforms raw video data into normalized data structure for single video

    Args:
        video_data (dict): the raw video data from the youtube api
        offered_by (str): the offered_by value for this video

    Returns:
        dict: normalized video data
    """  # noqa: D401
    return {
        "readable_id": video_data["id"],
        "platform": PlatformType.youtube.value,
        "resource_type": LearningResourceType.video.value,
        "title": video_data["snippet"]["localized"]["title"],
        "description": video_data["snippet"]["description"],
        "full_description": video_data["snippet"]["description"],
        "image": {"url": video_data["snippet"]["thumbnails"]["high"]["url"]},
        "last_modified": video_data["snippet"]["publishedAt"],
        "url": f"https://www.youtube.com/watch?v={video_data['id']}",
        "offered_by": [{"name": offered_by}] if offered_by else [],
        "published": True,
        "video": {
            "duration": video_data["contentDetails"]["duration"],
        },
    }


def transform_playlist(playlist_data, videos, offered_by):
    """
    Transform a playlist into our normalized data

    Args:
        playlist_data (tuple): the extracted playlist data
        videos (generator): generator for data for the playlist's videos
        offered_by (str): the offered_by value for this playlist
    Returns:
        dict:
            normalized playlist data
    """
    return {
        "playlist_id": playlist_data["id"],
        "title": playlist_data["snippet"]["title"],
        # intentional generator expression
        "videos": (
            transform_video(extracted_video, offered_by) for extracted_video in videos
        ),
    }


def transform(extracted_channels):
    """
    Transforms raw video data into normalized data structure

    Args:
        extracted_channels (iterable of tuple): the youtube channels that were fetched

    Returns:
        generator that yields normalized video data
    """  # noqa: D401
    # NOTE: this generator has nested generators (channels -> playlists -> videos)
    # this is by design so that when the loaders run an exception raised in an
    # extraction function can signal to the loader code that a partial import occurred
    # if you change this it may trigger undefined behavior in the loaders
    for offered_by, channel_data, playlists in extracted_channels:
        yield {
            "channel_id": channel_data["id"],
            "title": channel_data["snippet"]["title"],
            # intentional generator expression
            "playlists": (
                transform_playlist(playlist, videos, offered_by)
                for playlist, videos in playlists
            ),
        }


def get_youtube_videos_for_transcripts_job(
    *, created_after=None, created_minutes=None, overwrite=False
):
    """
    learning_resources.Video object filtered to tasks.get_youtube_transcripts job params

    Args:
        created_after (date or None):
            if a date inclued only videos with a created_on after that date
        created_minutes (int or None):
            if an int include only videos with created_on in the last created_minutes minutes
        overwrite (bool):
            if true include videos that already have transcripts

    Returns
        Django filtered learning_resources.videos object
    """  # noqa: E501

    video_resources = LearningResource.objects.select_related("video").filter(
        published=True, resource_type=LearningResourceType.video.value
    )

    if not overwrite:
        video_resources = video_resources.filter(video__transcript="")

    if created_after:
        video_resources = video_resources.filter(created_on__gte=created_after)
    elif created_minutes:
        date = now_in_utc() - timedelta(minutes=created_minutes)
        video_resources = video_resources.filter(created_on__gte=date)
    return video_resources


def get_youtube_transcripts(video_resources):
    """
    Fetch transcripts for Youtube video resources

    Args:
        vidoes - collection of learning_resources.Video objects
    """

    # The call to download the transcript occasionally fails. We'll retry once after the first failure.  # noqa: E501
    # If 15 consecutive  videos fail to load with pytube.exceptions.VideoUnavailable error  # noqa: E501
    # we will assume we are being rate limited and stop the job early

    consecutive_video_unavailable_failures = 0
    max_consecutive_video_unavailable_failures = 15
    for resource in video_resources:
        if (
            consecutive_video_unavailable_failures
            >= max_consecutive_video_unavailable_failures
        ):
            log.error(
                "%i consecutive faliures for transcript downloads. Ending transcript download job early. ",  # noqa: E501
                max_consecutive_video_unavailable_failures,
            )
            break

        tries = 2
        for attempt in range(tries):
            try:
                caption = get_captions_for_video(resource)
            except (pytube.exceptions.PytubeError, KeyError, HTTPError) as error:
                if attempt == tries - 1:
                    log.error(  # noqa: TRY400
                        "Unable to fetch transcript for video id=%i", resource.id
                    )  # noqa: RUF100, TRY400
                    if isinstance(error, pytube.exceptions.VideoUnavailable):
                        consecutive_video_unavailable_failures += 1
                continue
            else:
                video = resource.video
                video.transcript = parse_video_captions(caption)
                video.save()
                consecutive_video_unavailable_failures = 0
                break
            finally:
                time.sleep(settings.YOUTUBE_FETCH_TRANSCRIPT_SLEEP_SECONDS)
