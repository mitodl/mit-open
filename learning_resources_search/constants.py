"""Constants for search"""
from enum import Enum

from opensearchpy.exceptions import ConnectionError as ESConnectionError
from urllib3.exceptions import TimeoutError as UrlTimeoutError

ALIAS_ALL_INDICES = "all"
COURSE_TYPE = "course"
PROGRAM_TYPE = "program"

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
    # USER_LIST_TYPE,
    # USER_PATH_TYPE,
    # STAFF_LIST_TYPE,
    # VIDEO_TYPE,
    # PODCAST_TYPE,
    # PODCAST_EPISODE_TYPE,
    # RESOURCE_FILE_TYPE,
)

VALID_OBJECT_TYPES = (
    # PROFILE_TYPE,
    COURSE_TYPE,
    PROGRAM_TYPE,
    # USER_LIST_TYPE,
    # STAFF_LIST_TYPE,
    # VIDEO_TYPE,
    # PODCAST_TYPE,
    # PODCAST_EPISODE_TYPE,
)
GLOBAL_DOC_TYPE = "_doc"


SCRIPTING_LANG = "painless"
UPDATE_CONFLICT_SETTING = "proceed"
LEARNING_RESOURCE_SEARCH_FILTERS = [
    "resource_type",
    "certification",
    "offered_by",
    "topic",
    "department",
    "level",
    "resource_content_tags",
    "platform",
    "professional",
    "id",
    "course",
]

SEARCH_NESTED_FILTERS = {
    "topic": "topics.name",
    "level": "runs.level",
    "department": "departments.name",
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


LEARNING_RESOURCE_TYPE = {
    "id": {"type": "keyword"},
    "certification": {"type": "keyword"},
    "readable_id": {"type": "keyword"},
    "title": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "description": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "full_description": ENGLISH_TEXT_FIELD,
    "last_modified": {"type": "date"},
    "languages": {"type": "keyword"},
    "image": {
        "type": "nested",
        "properties": {
            "url": {"type": "keyword"},
            "description": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
            "alt": ENGLISH_TEXT_FIELD,
        },
    },
    "platform": {"type": "keyword"},
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
    "offered_by": {"type": "keyword"},
    "resource_content_tags": {"type": "keyword"},
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

LEARNING_RESOURCE_QUERY_FIELDS = [
    "title.english^3",
    "description.english^2",
    "full_description.english",
    "topics",
    "platform",
    "readable_id",
    "offered_by",
    "department",
    "resource_content_tags",
    "course",
]

AGGREGATIONS = [
    "resource_type",
    "certification",
    "offered_by",
    "platform",
    "topic",
    "department",
    "level",
    "resource_content_tags",
    "professional",
]

TOPICS_QUERY_FIELDS = ["topics.name"]

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

MAPPING = {
    COURSE_TYPE: LEARNING_RESOURCE_TYPE,
    PROGRAM_TYPE: LEARNING_RESOURCE_TYPE,
}

SEARCH_CONN_EXCEPTIONS = (ESConnectionError, UrlTimeoutError)
