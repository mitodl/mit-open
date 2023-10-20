"""Tests for ETL pipelines"""
from contextlib import contextmanager
from importlib import reload
from unittest.mock import patch

from course_catalog.etl import pipelines


@contextmanager
def reload_mocked_pipeline(*patchers):
    """Create a context that is rolled back after executing the pipeline"""
    mocks = [patcher.start() for patcher in patchers]

    reload(pipelines)

    yield mocks

    for patcher in patchers:
        patcher.stop()

    reload(pipelines)


def test_youtube_etl():
    """Verify that youtube etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("course_catalog.etl.youtube.extract", autospec=True),
        patch("course_catalog.etl.youtube.transform", autospec=True),
        patch("course_catalog.etl.loaders.load_video_channels", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_video_channels = patches
        result = pipelines.youtube_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_video_channels.assert_called_once_with(mock_transform.return_value)

    assert result == mock_load_video_channels.return_value
