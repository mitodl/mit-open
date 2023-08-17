"""Tests for ETL pipelines"""
from contextlib import contextmanager
from importlib import reload
from unittest.mock import patch

import pytest

from learning_resources.constants import PlatformType
from learning_resources.etl import pipelines


@contextmanager
def reload_mocked_pipeline(*patchers):
    """Create a context that is rolled back after executing the pipeline"""
    mocks = [patcher.start() for patcher in patchers]

    reload(pipelines)

    yield mocks

    for patcher in patchers:
        patcher.stop()

    reload(pipelines)


def test_xpro_programs_etl():
    """Verify that xpro programs etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.xpro.extract_programs", autospec=True),
        patch("learning_resources.etl.xpro.transform_programs", autospec=True),
        patch("learning_resources.etl.loaders.load_programs", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_programs = patches
        result = pipelines.xpro_programs_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_programs.assert_called_once_with(
        PlatformType.xpro.value, mock_transform.return_value
    )

    assert result == mock_load_programs.return_value


def test_xpro_courses_etl():
    """Verify that xpro courses etl pipeline executes correctly"""
    with reload_mocked_pipeline(
        patch("learning_resources.etl.xpro.extract_courses", autospec=True),
        patch("learning_resources.etl.xpro.transform_courses", autospec=True),
        patch("learning_resources.etl.loaders.load_courses", autospec=True),
    ) as patches:
        mock_extract, mock_transform, mock_load_courses = patches
        result = pipelines.xpro_courses_etl()

    mock_extract.assert_called_once_with()
    mock_transform.assert_called_once_with(mock_extract.return_value)
    mock_load_courses.assert_called_once_with(
        PlatformType.xpro.value,
        mock_transform.return_value,
    )

    assert result == mock_load_courses.return_value
