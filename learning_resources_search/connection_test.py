"""
Tests for the indexing API
"""

import pytest

from learning_resources_search.connection import get_active_aliases
from learning_resources_search.constants import COURSE_TYPE, IndexestoUpdate


@pytest.mark.parametrize(
    "index_types",
    [
        IndexestoUpdate.current_index.value,
        IndexestoUpdate.reindexing_index.value,
        IndexestoUpdate.all_indexes.value,
    ],
)
@pytest.mark.parametrize("indexes_exist", [True, False])
@pytest.mark.parametrize("object_types", [None, [COURSE_TYPE]])
def test_get_active_aliases(mocker, index_types, indexes_exist, object_types):
    """Test for get_active_aliases"""
    conn = mocker.Mock()
    conn.indices.exists.return_value = indexes_exist

    active_aliases = get_active_aliases(
        conn, object_types=object_types, index_types=index_types
    )

    if indexes_exist:
        if object_types:
            if index_types == IndexestoUpdate.all_indexes.value:
                assert active_aliases == [
                    "testindex_course_default",
                    "testindex_course_reindexing",
                ]
            elif index_types == IndexestoUpdate.current_index.value:
                assert active_aliases == ["testindex_course_default"]
            elif index_types == IndexestoUpdate.reindexing_index.value:
                assert active_aliases == ["testindex_course_reindexing"]
        elif index_types == IndexestoUpdate.all_indexes.value:
            assert active_aliases == [
                "testindex_percolator_default",
                "testindex_percolator_reindexing",
                "testindex_course_default",
                "testindex_course_reindexing",
                "testindex_program_default",
                "testindex_program_reindexing",
                "testindex_podcast_default",
                "testindex_podcast_reindexing",
                "testindex_podcast_episode_default",
                "testindex_podcast_episode_reindexing",
                "testindex_learning_path_default",
                "testindex_learning_path_reindexing",
                "testindex_video_default",
                "testindex_video_reindexing",
                "testindex_video_playlist_default",
                "testindex_video_playlist_reindexing",
            ]
        elif index_types == IndexestoUpdate.current_index.value:
            assert active_aliases == [
                "testindex_percolator_default",
                "testindex_course_default",
                "testindex_program_default",
                "testindex_podcast_default",
                "testindex_podcast_episode_default",
                "testindex_learning_path_default",
                "testindex_video_default",
                "testindex_video_playlist_default",
            ]
        elif index_types == IndexestoUpdate.reindexing_index.value:
            assert active_aliases == [
                "testindex_percolator_reindexing",
                "testindex_course_reindexing",
                "testindex_program_reindexing",
                "testindex_podcast_reindexing",
                "testindex_podcast_episode_reindexing",
                "testindex_learning_path_reindexing",
                "testindex_video_reindexing",
                "testindex_video_playlist_reindexing",
            ]
    else:
        assert active_aliases == []
