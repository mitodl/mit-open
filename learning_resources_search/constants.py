"""Constants for search"""

from dataclasses import dataclass
from enum import Enum

from opensearchpy.exceptions import ConnectionError as ESConnectionError
from urllib3.exceptions import TimeoutError as UrlTimeoutError

ALIAS_ALL_INDICES = "all"
COURSE_TYPE = "course"
PROGRAM_TYPE = "program"
CONTENT_FILE_TYPE = "content_file"
PODCAST_TYPE = "podcast"
PODCAST_EPISODE_TYPE = "podcast_episode"
LEARNING_PATH_TYPE = "learning_path"
VIDEO_TYPE = "video"
VIDEO_PLAYLIST_TYPE = "video_playlist"
PERCOLATE_INDEX_TYPE = "percolator"
CURRENT_INDEX = "current_index"
REINDEXING_INDEX = "reindexing_index"
BOTH_INDEXES = "all_indexes"

LEARNING_RESOURCE = "learning_resource"


class IndexestoUpdate(Enum):
    """
    Enum for index to update
    """

    current_index = "current_index"
    reindexing_index = "reindexing_index"
    all_indexes = "all_indexes"


LEARNING_RESOURCE_TYPES = (
    COURSE_TYPE,
    PROGRAM_TYPE,
    PODCAST_TYPE,
    PODCAST_EPISODE_TYPE,
    LEARNING_PATH_TYPE,
    VIDEO_TYPE,
    VIDEO_PLAYLIST_TYPE,
)

BASE_INDEXES = (PERCOLATE_INDEX_TYPE,)

ALL_INDEX_TYPES = BASE_INDEXES + LEARNING_RESOURCE_TYPES

SCRIPTING_LANG = "painless"
UPDATE_CONFLICT_SETTING = "proceed"


@dataclass
class FilterConfig:
    path: str
    case_sensitive: bool = False


LEARNING_RESOURCE_SEARCH_FILTERS = {
    "resource_type": FilterConfig("resource_type"),
    "certification": FilterConfig("certification"),
    "professional": FilterConfig("professional"),
    "id": FilterConfig("id", case_sensitive=True),
    "course_feature": FilterConfig("course_feature"),
    "content_feature_type": FilterConfig("content_feature_type"),
    "run_id": FilterConfig("run_id", case_sensitive=True),
    "resource_id": FilterConfig("resource_id"),
    "topic": FilterConfig("topics.name"),
    "level": FilterConfig("runs.level.code"),
    "department": FilterConfig("departments.department_id"),
    "platform": FilterConfig("platform.code"),
    "offered_by": FilterConfig("offered_by.code"),
}

SEARCH_NESTED_FILTERS = {
    "topic": "topics.name",
    "level": "runs.level.code",
    "department": "departments.department_id",
    "platform": "platform.code",
    "offered_by": "offered_by.code",
}

ENGLISH_TEXT_FIELD = {
    "type": "text",
    "fields": {"english": {"type": "text", "analyzer": "english"}},
}

ENGLISH_TEXT_FIELD_WITH_SUGGEST = {
    "type": "text",
    "fields": {
        "english": {"type": "text", "analyzer": "english"},
        "trigram": {"type": "text", "analyzer": "trigram"},
    },
}


LEARNING_RESOURCE_MAP = {
    "resource_relations": {"type": "join", "relations": {"resource": "content_file"}},
    "id": {"type": "long"},
    "certification": {"type": "boolean"},
    "readable_id": {"type": "keyword"},
    "title": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "description": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "full_description": ENGLISH_TEXT_FIELD,
    "last_modified": {"type": "date"},
    "created_on": {"type": "date"},
    "languages": {"type": "keyword"},
    "image": {
        "type": "nested",
        "properties": {
            "url": {"type": "keyword"},
            "description": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
            "alt": ENGLISH_TEXT_FIELD,
        },
    },
    "platform": {
        "type": "nested",
        "properties": {
            "code": {"type": "keyword"},
            "name": {"type": "keyword"},
        },
    },
    "departments": {
        "type": "nested",
        "properties": {
            "department_id": {"type": "keyword"},
            "name": {"type": "keyword"},
            "channel_url": {"type": "keyword"},
            "school": {
                "type": "nested",
                "properties": {
                    "id": {"type": "long"},
                    "name": "keyword",
                    "url": "keyword",
                },
            },
        },
    },
    "professional": {"type": "boolean"},
    "resource_type": {"type": "keyword"},
    "topics": {
        "type": "nested",
        "properties": {
            "id": {"type": "long"},
            "name": {"type": "keyword"},
            "channel_url": {"type": "keyword"},
        },
    },
    "offered_by": {
        "type": "nested",
        "properties": {
            "code": {"type": "keyword"},
            "name": {"type": "keyword"},
            "channel_url": {"type": "keyword"},
        },
    },
    "course_feature": {"type": "keyword"},
    "course": {
        "properties": {
            "course_numbers": {
                "type": "nested",
                "properties": {
                    "value": {"type": "keyword"},
                    "sort_coursenum": {"type": "keyword"},
                    "department": {
                        "properties": {
                            "department_id": {"type": "keyword"},
                            "name": {"type": "keyword"},
                            "channel_url": {"type": "keyword"},
                            "school": {
                                "type": "nested",
                                "properties": {
                                    "id": {"type": "long"},
                                    "name": "keyword",
                                    "url": "keyword",
                                },
                            },
                        }
                    },
                    "primary": {"type": "boolean"},
                },
            }
        }
    },
    "video": {
        "properties": {
            "duration": {"type": "keyword"},
            "transcript": ENGLISH_TEXT_FIELD,
        }
    },
    "runs": {
        "type": "nested",
        "properties": {
            "id": {"type": "long"},
            "run_is": {"type": "keyword"},
            "title": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
            "description": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
            "full_description": ENGLISH_TEXT_FIELD,
            "last_modified": {"type": "date"},
            "languages": {"type": "keyword"},
            "slug": {"type": "keyword"},
            "availability": {"type": "keyword"},
            "semester": {"type": "keyword"},
            "year": {"type": "keyword"},
            "start_date": {"type": "date"},
            "end_date": {"type": "date"},
            "enrollment_start": {"type": "date"},
            "enrollment_end": {"type": "date"},
            "level": {
                "type": "nested",
                "properties": {
                    "code": {"type": "keyword"},
                    "name": {"type": "keyword"},
                },
            },
            "instructors": {
                "type": "nested",
                "properties": {
                    "id": {"type": "long"},
                    "first_name": {"type": "keyword"},
                    "last_name": {"type": "keyword"},
                    "full_name": ENGLISH_TEXT_FIELD,
                },
            },
            "prices": {"type": "scaled_float", "scaling_factor": 100},
        },
    },
}


CONTENT_FILE_MAP = {
    "id": {"type": "long"},
    "run_id": {"type": "long"},
    "run_readble_id": {"type": "keyword"},
    "run_title": ENGLISH_TEXT_FIELD,
    "run_slug": {"type": "keyword"},
    "departments": {
        "type": "nested",
        "properties": {
            "department_id": {"type": "keyword"},
            "name": {"type": "keyword"},
            "channel_url": {"type": "keyword"},
            "school": {
                "type": "nested",
                "properties": {
                    "id": {"type": "long"},
                    "name": "keyword",
                    "url": "keyword",
                },
            },
        },
    },
    "semester": {"type": "keyword"},
    "year": {"type": "keyword"},
    "key": {"type": "keyword"},
    "uid": {"type": "keyword"},
    "title": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "description": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "url": {"type": "keyword"},
    "file_type": {"type": "keyword"},
    "content_type": {"type": "keyword"},
    "content_feature_type": {"type": "keyword"},
    "content": ENGLISH_TEXT_FIELD,
    "content_title": ENGLISH_TEXT_FIELD,
    "content_author": ENGLISH_TEXT_FIELD,
    "content_language": {"type": "keyword"},
    "image_src": {"type": "keyword"},
    "resource_id": {"type": "long"},
    "resource_readable_id": {"type": "keyword"},
    "course_number": {"type": "keyword"},
    "offered_by": {
        "type": "nested",
        "properties": {
            "code": {"type": "keyword"},
            "name": {"type": "keyword"},
        },
    },
    "platform": {
        "type": "nested",
        "properties": {
            "code": {"type": "keyword"},
            "name": {"type": "keyword"},
        },
    },
}


PERCOLATE_INDEX_MAP = {"query": {"type": "percolator"}}

LEARNING_RESOURCE_QUERY_FIELDS = [
    "title.english^3",
    "description.english^2",
    "full_description.english",
    "topics",
    "platform",
    "readable_id",
    "offered_by",
    "course_feature",
    "course",
    "video.transcript.english",
]

TOPICS_QUERY_FIELDS = ["topics.name"]
DEPARTMENT_QUERY_FIELDS = ["departments.department_id"]

COURSE_QUERY_FIELDS = [
    "course.course_numbers.value",
]

RUNS_QUERY_FIELDS = [
    "runs.year",
    "runs.semester",
    "runs.level",
]

RUN_INSTRUCTORS_QUERY_FIELDS = [
    "runs.instructors.first_name",
    "runs.instructors.last_name",
    "runs.instructors.full_name",
]

RESOURCEFILE_QUERY_FIELDS = [
    "content",
    "title.english^3",
    "short_description.english^2",
    "content_feature_type",
]

MAPPING = {
    COURSE_TYPE: {**LEARNING_RESOURCE_MAP, **CONTENT_FILE_MAP},
    PROGRAM_TYPE: LEARNING_RESOURCE_MAP,
    PODCAST_TYPE: LEARNING_RESOURCE_MAP,
    PODCAST_EPISODE_TYPE: LEARNING_RESOURCE_MAP,
    LEARNING_PATH_TYPE: LEARNING_RESOURCE_MAP,
    VIDEO_TYPE: LEARNING_RESOURCE_MAP,
    VIDEO_PLAYLIST_TYPE: LEARNING_RESOURCE_MAP,
    PERCOLATE_INDEX_TYPE: {
        **PERCOLATE_INDEX_MAP,
        **LEARNING_RESOURCE_MAP,
        **CONTENT_FILE_MAP,
    },
}

SEARCH_CONN_EXCEPTIONS = (ESConnectionError, UrlTimeoutError)

SOURCE_EXCLUDED_FIELDS = [
    "course.course_numbers.sort_coursenum",
    "course.course_numbers.primary",
    "created_on",
    "resource_relations",
]
