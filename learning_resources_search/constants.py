"""Constants for search"""

from enum import Enum

from opensearchpy.exceptions import ConnectionError as ESConnectionError
from urllib3.exceptions import TimeoutError as UrlTimeoutError

ALIAS_ALL_INDICES = "all"
COURSE_TYPE = "course"
PROGRAM_TYPE = "program"
CONTENT_FILE_TYPE = "content_file"
CONTENT_EMBEDDING_TYPE = "content_embedding"
PODCAST_TYPE = "podcast"
PODCAST_EPISODE_TYPE = "podcast_episode"
LEARNING_PATH_TYPE = "learning_path"

CURRENT_INDEX = "current_index"
REINDEXING_INDEX = "reindexing_index"
BOTH_INDEXES = "all_indexes"


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
)


SCRIPTING_LANG = "painless"
UPDATE_CONFLICT_SETTING = "proceed"
LEARNING_RESOURCE_SEARCH_FILTERS = [
    "resource_type",
    "certification",
    "offered_by",
    "topic",
    "department",
    "level",
    "platform",
    "professional",
    "id",
    "course_feature",
    "content_feature_type",
    "run_id",
    "resource_id",
]

SEARCH_NESTED_FILTERS = {
    "topic": "topics.name",
    "level": "runs.level",
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
    "certification": {"type": "keyword"},
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
        },
    },
    "professional": {"type": "boolean"},
    "resource_type": {"type": "keyword"},
    "topics": {
        "type": "nested",
        "properties": {
            "id": {"type": "long"},
            "name": {"type": "keyword"},
        },
    },
    "offered_by": {
        "type": "nested",
        "properties": {
            "code": {"type": "keyword"},
            "name": {"type": "keyword"},
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
                        }
                    },
                    "primary": {"type": "boolean"},
                },
            }
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
            "level": {"type": "keyword"},
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
    # "resource_relations": {"type": "join", "relations": {"content_file": "content_file_chunk"}},
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
    "resource_type": {"type": "keyword"},
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
    "embedding": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {"name": "hnsw", "space_type": "cosinesimil", "engine": "nmslib"},
    },
}


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
    COURSE_TYPE: {
        **LEARNING_RESOURCE_MAP,
        **CONTENT_FILE_MAP,
    },
    PROGRAM_TYPE: LEARNING_RESOURCE_MAP,
    PODCAST_TYPE: LEARNING_RESOURCE_MAP,
    PODCAST_EPISODE_TYPE: LEARNING_RESOURCE_MAP,
    LEARNING_PATH_TYPE: LEARNING_RESOURCE_MAP,
}

SEARCH_CONN_EXCEPTIONS = (ESConnectionError, UrlTimeoutError)

SOURCE_EXCLUDED_FIELDS = [
    "course.course_numbers.sort_coursenum",
    "course.course_numbers.primary",
    "created_on",
    "resource_relations",
]
