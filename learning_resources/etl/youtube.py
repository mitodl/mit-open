"""video catalog ETL"""

import logging
from collections.abc import Generator
from datetime import timedelta
from typing import Optional

import googleapiclient.errors
import requests
import yaml
from django.conf import settings
from googleapiclient.discovery import Resource, build
from googleapiclient.http import BatchHttpRequest
from youtube_transcript_api import (
    NoTranscriptFound,
    TranscriptsDisabled,
    YouTubeTranscriptApi,
)
from youtube_transcript_api.formatters import TextFormatter

from learning_resources.constants import LearningResourceType, OfferedBy, PlatformType
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.exceptions import ExtractException
from learning_resources.etl.loaders import update_index
from learning_resources.etl.utils import clean_data
from learning_resources.models import LearningResource
from main.utils import now_in_utc

CONFIG_FILE_REPO = "mitodl/open-video-data"
CONFIG_FILE_FOLDER = "youtube"
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"
YOUTUBE_MAX_RESULTS = 50
WILDCARD_PLAYLIST_ID = "all"

log = logging.getLogger()


def parse_offered_by(offered_by_code: str) -> dict:
    """
    Return a dict with the offered_by code

    Args:
        offered_by_code (str): the offered_by code

    Returns:
        dict: the offered_by dict
    """
    if offered_by_code in OfferedBy.names():
        return {"code": offered_by_code}
    return None


def get_youtube_client() -> Resource:
    """
    Generate a Google api client for Youtube

    Returns:
        Google Api client resource
    """

    developer_key = settings.YOUTUBE_DEVELOPER_KEY
    return build(
        YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=developer_key
    )


def extract_videos(
    youtube_client: Resource, video_ids: list[str]
) -> Generator[dict, None, None]:
    """
    Loop through a list of video ids and yield video data

    Args:
        youtube_client (Resource): Youtube api client resource
        video_ids (list of str): video ids

    Returns:
        A generator that yields video data
    """
    video_ids = list(video_ids)
    try:
        request = youtube_client.videos().list(
            part="snippet,contentDetails", id=",".join(video_ids)
        )
        response = request.execute()

        # yield items in the order in which they were passed in
        yield from sorted(
            response["items"], key=lambda item: video_ids.index(item["id"])
        )
    except StopIteration:
        return
    except googleapiclient.errors.HttpError as exc:
        msg = f"Error fetching video_ids={video_ids}"
        raise ExtractException(msg) from exc


def extract_playlist_items(
    youtube_client: Resource, playlist_id: str
) -> Generator[dict, None, None]:
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
            part="contentDetails",
            maxResults=YOUTUBE_MAX_RESULTS,
            playlistId=playlist_id,
        )

        while request is not None:
            response = request.execute()

            if response is None:
                break

            video_ids = (
                item["contentDetails"]["videoId"] for item in response["items"]
            )

            yield from extract_videos(youtube_client, video_ids)

            request = youtube_client.playlistItems().list_next(request, response)

    except StopIteration:
        return
    except googleapiclient.errors.HttpError as exc:
        msg = f"Error fetching playlist items: playlist_id={playlist_id}"
        raise ExtractException(msg) from exc


def _extract_playlists(
    youtube_client: Resource, request: BatchHttpRequest, playlist_configs: dict
) -> Generator[tuple, None, None]:
    """
    Extract a list of playlists

    Args:
        youtube_client (Resource): Youtube api client
        request (BatchHttpRequest): Youtube api BatchHttpRequest object
        playlist_configs (dict): dict of playlist configurations

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
                    playlist_config = playlist_configs.get(
                        WILDCARD_PLAYLIST_ID, {"ignore": True}
                    )

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
        raise ExtractException(msg) from exc


def extract_playlists(
    youtube_client: Resource, playlist_configs: list[dict], channel_id: str
) -> Generator[tuple, None, None]:
    """
    Extract a list of playlists for a channel
    Args:
        youtube_client (object): Youtube api client
        playlist_configs (list of dict): list of playlist configurations
        channel_id (str): youtube's id for the channel
    Returns:
        A generator that yields playlist data
    """

    playlist_configs_by_id = {
        playlist_config["id"]: playlist_config for playlist_config in playlist_configs
    }
    requests = []

    if WILDCARD_PLAYLIST_ID in playlist_configs_by_id:
        requests.append(
            youtube_client.playlists().list(
                part="snippet", channelId=channel_id, maxResults=YOUTUBE_MAX_RESULTS
            )
        )

    else:
        playlist_ids = playlist_configs_by_id.keys()
        requests.append(
            youtube_client.playlists().list(
                part="snippet",
                id=",".join(playlist_ids),
                maxResults=YOUTUBE_MAX_RESULTS,
            )
        )

    for request in requests:
        yield from _extract_playlists(youtube_client, request, playlist_configs_by_id)


def extract_channels(
    youtube_client: Resource, channels_config: list[dict]
) -> Generator[tuple, None, None]:
    """
    Extract a list of channels

    Args:
        youtube_client (Resource): Youtube api client
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
            part="snippet,contentDetails",
            id=",".join(channel_ids),
            maxResults=YOUTUBE_MAX_RESULTS,
        )

        while request is not None:
            response = request.execute()

            if response is None:
                break

            for channel_data in response["items"]:
                channel_id = channel_data["id"]
                channel_config = channel_configs_by_ids[channel_id]
                offered_by = channel_config.get("offered_by", None)
                playlist_configs = channel_config.get("playlists", [])

                # if we hit any error on a playlist, we simply abort
                playlists = extract_playlists(
                    youtube_client, playlist_configs, channel_id
                )
                yield (offered_by, channel_data, playlists)

            request = youtube_client.channels().list_next(request, response)
    except StopIteration:
        return
    except googleapiclient.errors.HttpError as exc:
        msg = f"Error fetching channels: channel_ids={channel_ids}"
        raise ExtractException(msg) from exc


def get_captions_for_video(video_resource: LearningResource) -> str:
    """
    Fetch and return xml captions for a video object

    Args:
        video_resource (learning_resources.models.LearningResource)

    Returns:
        str: transcript text

    """
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(
            video_resource.readable_id
        )
        transcript = transcript_list.find_manually_created_transcript(["en"])
        if not transcript:
            transcript = transcript_list.find_generated_transcript(["en"])
        if transcript:
            return TextFormatter().format_transcript(transcript.fetch())
    except (NoTranscriptFound, TranscriptsDisabled):
        pass


def github_youtube_config_file() -> bytes:
    """
    Return youtube config channel data from a url

    Returns:
        The content of the youtube config file
    """
    response = requests.get(
        settings.YOUTUBE_CONFIG_URL, timeout=settings.REQUESTS_TIMEOUT
    )
    response.raise_for_status()
    return response.content


def validate_channel_configs(channel_configs: dict) -> list[str]:
    """
    Validate a channel config

    Args:
        channel_configs (dict): the channel config object

    Returns:
        list of str: list of errors or an empty list if no errors
    """
    errors = []

    if not channel_configs:
        errors.append("Channel configs data is empty")
        return errors

    if not isinstance(channel_configs, list):
        errors.append("Channels data should be a list of dicts")
        return errors
    for channel_config in channel_configs:
        if not isinstance(channel_config, dict):
            errors.append("Channel data should be a dict")
            return errors
        for required_key in ["channel_id", "playlists"]:
            if required_key not in channel_config:
                errors.append(  # noqa: PERF401
                    f"Required key '{required_key}' is not present in channel dict"
                )
        for idx, playlist_config in enumerate(channel_config.get("playlists", [])):
            if "id" not in playlist_config:
                errors.append(f"Required key 'id' not present in playlists[{idx}]")

    return errors


def get_youtube_channel_configs(*, channel_ids: Optional[str] = None) -> list[dict]:
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

    youtube_configs = yaml.safe_load(github_youtube_config_file())
    errors = validate_channel_configs(youtube_configs)

    if errors:
        log.error(
            "Invalid youtube channel configs, errors=%s",
            errors,
        )
    else:
        channel_configs = [
            channel
            for channel in youtube_configs
            if not channel_ids or channel["channel_id"] in channel_ids
        ]
    return channel_configs


def extract(*, channel_ids: Optional[str] = None) -> Generator[tuple, None, None]:
    """
    Return video data for all videos in channels' playlists

    Args:
        channel_ids (list of str or None): list of channels to extract (all if None)

    Returns:
        A generator that yields tuples with offered_by and video data
    """
    for setting in ("YOUTUBE_CONFIG_URL", "YOUTUBE_DEVELOPER_KEY"):
        if not getattr(settings, setting):
            log.error("Missing required setting %s", setting)
            return

    youtube_client = get_youtube_client()
    channel_configs = get_youtube_channel_configs(channel_ids=channel_ids)

    yield from extract_channels(youtube_client, channel_configs)


def transform_video(video_data: dict, offered_by_code: str) -> dict:
    """
    Transform raw video data into normalized data structure for single video

    Args:
        video_data (dict): the raw video data from the youtube api
        offered_by_code (str): the offered_by code for this video

    Returns:
        dict: normalized video data
    """
    return {
        "readable_id": video_data["id"],
        "platform": PlatformType.youtube.name,
        "etl_source": ETLSource.youtube.name,
        "resource_type": LearningResourceType.video.name,
        "title": video_data["snippet"]["localized"]["title"],
        "description": clean_data(video_data["snippet"]["description"]),
        "image": {"url": video_data["snippet"]["thumbnails"]["high"]["url"]},
        "last_modified": video_data["snippet"]["publishedAt"],
        "url": f"https://www.youtube.com/watch?v={video_data['id']}",
        "offered_by": parse_offered_by(offered_by_code),
        "published": True,
        "video": {
            "duration": video_data["contentDetails"]["duration"],
        },
    }


def transform_playlist(
    playlist_data: dict, videos: Generator[dict, None, None], offered_by_code: str
) -> dict:
    """
    Transform a playlist into our normalized data

    Args:
        playlist_data (dict): the extracted playlist data
        videos (generator): generator for data for the playlist's videos
        offered_by_code (str): the offered_by code for this playlist
    Returns:
        dict: normalized playlist data
    """
    return {
        "playlist_id": playlist_data["id"],
        "title": playlist_data["snippet"]["title"],
        "description": clean_data(playlist_data["snippet"]["description"]),
        "published": True,
        "platform": PlatformType.youtube.name,
        "etl_source": ETLSource.youtube.name,
        "offered_by": parse_offered_by(offered_by_code),
        # intentional generator expression
        "videos": (
            transform_video(extracted_video, offered_by_code)
            for extracted_video in videos
        ),
    }


def transform(extracted_channels: iter) -> Generator[dict, None, None]:
    """
    Transform raw video data into normalized data structure

    Args:
        extracted_channels (iterable of tuple): the youtube channels that were fetched

    Returns:
        generator that yields normalized video data
    """
    # NOTE: this generator has nested generators (channels -> playlists -> videos)
    # this is by design so that when the loaders run an exception raised in an
    # extraction function can signal to the loader code that a partial import occurred
    # if you change this it may trigger undefined behavior in the loaders
    for offered_by, channel_data, playlists in extracted_channels:
        yield {
            "channel_id": channel_data["id"],
            "title": channel_data["snippet"]["title"],
            "published": True,
            # intentional generator expression
            "playlists": (
                transform_playlist(playlist, videos, offered_by)
                for playlist, videos in playlists
            ),
        }


def get_youtube_videos_for_transcripts_job(
    *,
    created_after: Optional[str] = None,
    created_minutes: Optional[str] = None,
    overwrite: bool = False,
) -> list[LearningResource]:
    """
    learning_resources.Video object filtered to tasks.get_youtube_transcripts job params

    Args:
        created_after (date or None):
            if a date inclued only videos with a created_on after that date
        created_minutes (int or None):
            if an int include only videos with created_on in the last x minutes
        overwrite (bool):
            if true include videos that already have transcripts

    Returns:
        list of LearningResource objects
    """

    video_resources = LearningResource.objects.select_related("video").filter(
        published=True, resource_type=LearningResourceType.video.name
    )

    if not overwrite:
        video_resources = video_resources.filter(video__transcript="")

    if created_after:
        video_resources = video_resources.filter(created_on__gte=created_after)
    elif created_minutes:
        date = now_in_utc() - timedelta(minutes=created_minutes)
        video_resources = video_resources.filter(created_on__gte=date)
    return video_resources


def get_youtube_transcripts(video_resources: list[LearningResource]):
    """
    Fetch transcripts for Youtube video resources

    Args:
        video_resources - list of video LearningResources
    """

    for resource in video_resources:
        captions = get_captions_for_video(resource)
        if captions:
            video = resource.video
            video.transcript = captions
            video.save()
            update_index(resource, newly_created=False)
