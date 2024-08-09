"""Tests for news_events tasks"""

from news_events import tasks


def test_get_medium_mit_news(mocker):
    """Task should call the medium_mit_news_etl pipeline"""
    mock_etl = mocker.patch(
        "news_events.etl.pipelines.medium_mit_news_etl", autospec=True
    )
    tasks.get_medium_mit_news.delay()
    mock_etl.assert_called_once()


def test_get_ol_events(mocker):
    """Task should call the ol_events_etl pipeline"""
    mock_etl = mocker.patch("news_events.etl.pipelines.ol_events_etl", autospec=True)
    tasks.get_ol_events.delay()
    mock_etl.assert_called_once()


def test_get_sloan_exec_news(mocker):
    """Task should call the sloan_exec_news_etl pipeline"""
    mock_etl = mocker.patch(
        "news_events.etl.pipelines.sloan_exec_news_etl", autospec=True
    )
    tasks.get_sloan_exec_news.delay()
    mock_etl.assert_called_once()


def test_get_mitpe_events(mocker):
    """Task should call the mitpe_events_etl pipeline"""
    mock_etl = mocker.patch("news_events.etl.pipelines.mitpe_events_etl", autospec=True)
    tasks.get_mitpe_events.delay()
    mock_etl.assert_called_once()


def test_get_mitpe_news(mocker):
    """Task should call the mitpe_news_etl pipeline"""
    mock_etl = mocker.patch("news_events.etl.pipelines.mitpe_news_etl", autospec=True)
    tasks.get_mitpe_news.delay()
    mock_etl.assert_called_once()
