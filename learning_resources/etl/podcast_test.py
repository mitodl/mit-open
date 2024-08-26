"""Tests for Podcast ETL functions"""

import datetime
from unittest.mock import Mock

import pytest
import yaml
from bs4 import BeautifulSoup as bs  # noqa: N813
from dateutil.tz import tzutc
from django.conf import settings
from freezegun import freeze_time

from learning_resources.constants import Availability, LearningResourceType, OfferedBy
from learning_resources.etl.constants import ETLSource
from learning_resources.etl.podcast import (
    extract,
    generate_aggregate_podcast_rss,
    github_podcast_config_files,
    transform,
    validate_podcast_config,
)
from learning_resources.factories import (
    PodcastEpisodeFactory,
)
from main.utils import frontend_absolute_url

pytestmark = pytest.mark.django_db


@pytest.fixture()
def mock_github_client(mocker):
    """Return a mock github client"""
    return mocker.patch("github.Github")


def rss_content():
    """Test rss data"""

    with open("./test_html/test_podcast.rss") as f:  # noqa: PTH123
        return f.read()


def mock_podcast_file(  # pylint: disable=too-many-arguments  # noqa: PLR0913
    podcast_title=None,
    topics=None,
    website_url="http://website.url/podcast",
    offered_by=None,
    google_podcasts_url="google_podcasts_url",
    apple_podcasts_url="apple_podcasts_url",
    rss_url="http://website.url/podcast/rss.xml",
):
    """Mock podcast github file"""

    content = f"""---
rss_url: {rss_url}
{ "podcast_title: " + podcast_title if podcast_title else "" }
{ "topics: " + topics if topics else "" }
{ "offered_by: " + offered_by if offered_by else "" }
website:  {website_url}
google_podcasts_url: {google_podcasts_url}
apple_podcasts_url: {apple_podcasts_url}
"""
    return Mock(decoded_content=content)


@pytest.fixture()
def mock_rss_request(mocker):  # noqa: PT004
    """
    Mock request data
    """

    mocker.patch(
        "learning_resources.etl.podcast.requests.get",
        side_effect=[mocker.Mock(content=rss_content())],
    )


@pytest.fixture()
def mock_rss_request_with_bad_rss_file(mocker):  # noqa: PT004
    """
    Mock request data
    """

    mocker.patch(
        "learning_resources.etl.podcast.requests.get",
        side_effect=[mocker.Mock(content=""), mocker.Mock(content=rss_content())],
    )


@pytest.mark.usefixtures("mock_rss_request")
def test_extract(mock_github_client):
    """Test extract function"""

    podcast_list = [mock_podcast_file()]
    mock_github_client.return_value.get_repo.return_value.get_contents.return_value = (
        podcast_list
    )

    results = list(extract())

    expected_content = bs(rss_content(), "xml")
    mock_config = mock_podcast_file()

    assert len(results) == 1

    assert results == [(expected_content, yaml.safe_load(mock_config.decoded_content))]


@pytest.mark.usefixtures("mock_rss_request")
@pytest.mark.parametrize("title", [None, "Custom Title"])
@pytest.mark.parametrize("topics", [None, "Science,  Technology"])
@pytest.mark.parametrize("offered_by", [None, OfferedBy.ocw.value, "fake"])
def test_transform(mock_github_client, title, topics, offered_by):
    """Test transform function"""
    podcast_list = [mock_podcast_file(title, topics, "website_url", offered_by)]
    mock_github_client.return_value.get_repo.return_value.get_contents.return_value = (
        podcast_list
    )

    expected_topics = (
        [{"name": topic.strip()} for topic in topics.split(",")] if topics else []
    )

    expected_title = title if title else "A Podcast"

    expected_offered_by = {"name": offered_by} if offered_by else None

    episodes_rss = list(bs(rss_content(), "xml").find_all("item"))

    expected_results = [
        {
            "readable_id": "website.url/podcast/rss.xml",
            "etl_source": ETLSource.podcast.name,
            "title": expected_title,
            "offered_by": expected_offered_by,
            "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            "image": {"url": "apicture.jpg"},
            "published": True,
            "url": "website_url",
            "podcast": {
                "google_podcasts_url": "google_podcasts_url",
                "apple_podcasts_url": "apple_podcasts_url",
                "rss_url": "http://website.url/podcast/rss.xml",
            },
            "resource_type": LearningResourceType.podcast.name,
            "topics": expected_topics,
            "availability": [Availability.anytime.name],
            "episodes": [
                {
                    "readable_id": "tag:soundcloud,2010:tracks/numbers1",
                    "etl_source": ETLSource.podcast.name,
                    "title": "Episode1",
                    "availability": [Availability.anytime.name],
                    "offered_by": expected_offered_by,
                    "description": (
                        "SMorbi id consequat nisl. Morbi leo elit, vulputate nec"
                        " aliquam molestie, ullamcorper sit amet tortor"
                    ),
                    "url": "http://feeds.soundcloud.com/stream/episode1.mp3",
                    "image": {"url": "apicture.jpg"},
                    "last_modified": datetime.datetime(
                        2020, 4, 1, 18, 20, 31, tzinfo=tzutc()
                    ),
                    "published": True,
                    "podcast_episode": {
                        "episode_link": "https://soundcloud.com/podcast/episode1",
                        "duration": "PT17M16S",
                        "rss": episodes_rss[0].prettify(),
                    },
                    "resource_type": LearningResourceType.podcast_episode.name,
                    "topics": expected_topics,
                },
                {
                    "readable_id": "tag:soundcloud,2010:tracks/numbers2",
                    "etl_source": ETLSource.podcast.name,
                    "title": "Episode2",
                    "availability": [Availability.anytime.name],
                    "offered_by": expected_offered_by,
                    "description": (
                        "Praesent fermentum suscipit metus nec aliquam. Proin hendrerit"
                        " felis ut varius facilisis."
                    ),
                    "url": "http://feeds.soundcloud.com/stream/episode2.mp3",
                    "image": {"url": "image1.jpg"},
                    "last_modified": datetime.datetime(
                        2020, 4, 1, 18, 20, 31, tzinfo=tzutc()
                    ),
                    "published": True,
                    "podcast_episode": {
                        "episode_link": "https://soundcloud.com/podcast/episode2",
                        "duration": "PT17M16S",
                        "rss": episodes_rss[1].prettify(),
                    },
                    "resource_type": LearningResourceType.podcast_episode.name,
                    "topics": expected_topics,
                },
            ],
        }
    ]

    extract_results = extract()

    results = list(transform(extract_results))

    assert [
        {**podcast, "episodes": list(podcast["episodes"])} for podcast in results
    ] == expected_results


@pytest.mark.usefixtures("mock_rss_request_with_bad_rss_file")
def test_transform_with_error(mocker, mock_github_client):
    """Test transform function with bad rss file"""

    mock_exception_log = mocker.patch("learning_resources.etl.podcast.log.exception")

    podcast_list = [mock_podcast_file(None, None, "website_url2"), mock_podcast_file()]
    mock_github_client.return_value.get_repo.return_value.get_contents.return_value = (
        podcast_list
    )

    extract_results = extract()

    results = list(transform(extract_results))

    mock_exception_log.assert_called_once_with(
        "Error parsing podcast data from %s", "http://website.url/podcast/rss.xml"
    )

    assert len(results) == 1
    assert results[0]["url"] == "http://website.url/podcast"


@pytest.mark.django_db()
@freeze_time("2020-07-20")
def test_generate_aggregate_podcast_rss():
    """Test generate_aggregate_podcast_rss"""
    resource_1 = PodcastEpisodeFactory.create(
        rss="<item>rss1</item>",
    ).learning_resource
    resource_2 = PodcastEpisodeFactory.create(
        rss="<item>rss2</item>",
    ).learning_resource
    resource_1.last_modified = datetime.datetime(2020, 2, 1, tzinfo=datetime.UTC)
    resource_1.save()
    resource_2.last_modified = datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC)
    resource_2.save()

    podcasts_url = frontend_absolute_url("/podcasts")
    cover_image_url = frontend_absolute_url("/static/images/podcast_cover_art.png")

    expected_rss = f"""<?xml version='1.0' encoding='UTF-8'?>
    <rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
        <channel>
            <title>MIT Learn Aggregated Podcast Feed</title>
            <link>{podcasts_url}</link>
            <language>en-us</language>
            <pubDate>Mon, 20 Jul 2020  00:00:00 +0000</pubDate>
            <lastBuildDate>Mon, 20 Jul 2020  00:00:00 +0000</lastBuildDate>
            <ttl>60</ttl>
            <itunes:subtitle>Episodes from podcasts from around MIT</itunes:subtitle>
            <itunes:author>MIT Open Learning</itunes:author>
            <itunes:summary>Episodes from podcasts from around MIT</itunes:summary>
            <description>Episodes from podcasts from around MIT</description>
            <itunes:owner>
                <itunes:name>MIT Open Learning</itunes:name>
                <itunes:email>{settings.EMAIL_SUPPORT}</itunes:email>
            </itunes:owner>
            <image>
              <url>{cover_image_url}</url>
              <title>MIT Learn Aggregated Podcast Feed</title>
              <link>{podcasts_url}</link>
            </image>
            <itunes:explicit>no</itunes:explicit>
            <itunes:category text="Education"/>
            <item>rss1</item>
            <item>rss2</item>
        </channel>
    </rss>"""

    result = generate_aggregate_podcast_rss().prettify()

    assert result == bs(expected_rss, "xml").prettify()


@pytest.mark.parametrize("github_token", [None, "token"])
def test_github_podcast_config_files(settings, mock_github_client, github_token):
    """Test the logic for retrieving podcast config files from github"""
    settings.GITHUB_ACCESS_TOKEN = github_token
    mock_github_client.return_value.get_repo.return_value.get_contents.return_value = [
        mock_podcast_file(),
        mock_podcast_file(),
    ]

    results = github_podcast_config_files()

    assert len(results) == 2


@pytest.mark.parametrize(
    ("config", "errors"),
    [
        ({}, ["podcast config data is empty"]),
        (
            [{"rss_url": "http://test.edu"}, {"website": "http://test.edu"}],
            ["Podcast data should be a dict"],
        ),
        (None, ["podcast config data is empty"]),
        ({"rss_url": "http://test.edu", "website": "http://test.edu"}, []),
    ],
)
def test_validate_podcast_config(config, errors):
    """Test the logic for validating podcast config files"""
    assert validate_podcast_config(config) == errors
