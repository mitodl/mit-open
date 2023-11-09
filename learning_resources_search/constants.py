"""Constants for search"""

from enum import Enum

from opensearchpy.exceptions import ConnectionError as ESConnectionError
from urllib3.exceptions import TimeoutError as UrlTimeoutError

ALIAS_ALL_INDICES = "all"
COURSE_TYPE = "course"
PROGRAM_TYPE = "program"
CONTENT_FILE_TYPE = "content_file"

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
    "content_category",
    "run_id",
    "resource_id",
]

SEARCH_NESTED_FILTERS = {
    "topic": "topics.name",
    "level": "runs.level",
    "department": "departments.department_id",
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
        },
    },
    "semester": {"type": "keyword"},
    "year": {"type": "keyword"},
    "key": {"type": "keyword"},
    "uid": {"type": "keyword"},
    "title": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "description": ENGLISH_TEXT_FIELD_WITH_SUGGEST,
    "url": {"type": "keyword"},
    "short_url": {"type": "keyword"},
    "section": {"type": "keyword"},
    "section_slug": {"type": "keyword"},
    "file_type": {"type": "keyword"},
    "content_type": {"type": "keyword"},
    "content_category": {"type": "keyword"},
    "content": ENGLISH_TEXT_FIELD,
    "content_title": ENGLISH_TEXT_FIELD,
    "content_author": ENGLISH_TEXT_FIELD,
    "content_language": {"type": "keyword"},
    "image_src": {"type": "keyword"},
    "resource_id": {"type": "long"},
    "resource_readable_id": {"type": "keyword"},
    "resource_readable_num": {"type": "keyword"},
    "resource_type": {"type": "keyword"},
    "offered_by": {"type": "keyword"},
    "platform": {"type": "keyword"},
}


LEARNING_RESOURCE_QUERY_FIELDS = [
    "title.english^3",
    "description.english^2",
    "full_description.english",
    "topics",
    "platform",
    "readable_id",
    "offered_by",
    "resource_content_tags",
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
    "content_category",
]

MAPPING = {
    COURSE_TYPE: {**LEARNING_RESOURCE_MAP, **CONTENT_FILE_MAP},
    PROGRAM_TYPE: LEARNING_RESOURCE_MAP,
}

SEARCH_CONN_EXCEPTIONS = (ESConnectionError, UrlTimeoutError)

SOURCE_EXCLUDED_FIELDS = [
    "course.course_numbers.sort_coursenum",
    "course.course_numbers.primary",
    "resource_relations",
]

LEARNING_RESOURCE_SORTBY_OPTIONS = {
    "id": {
        "title": "Object ID ascending",
        "sort": "id",
    },
    "-id": {
        "title": "Object ID descending",
        "sort": "-id",
    },
    "readable_id": {
        "title": "Readable ID ascending",
        "sort": "readable_id",
    },
    "-readable_id": {
        "title": "Readable ID descending",
        "sort": "-readable_id",
    },
    "last_modified": {
        "title": "Last Modified Date ascending",
        "sort": "last_modified",
    },
    "-last_modified": {
        "title": "Last Modified Date descending",
        "sort": "-last_modified",
    },
    "start_date": {
        "title": "Start Date ascending",
        "sort": "runs.start_date",
    },
    "-start_date": {
        "title": "Start Date descending",
        "sort": "-runs.start_date",
    },
    "mitcoursenumber": {
        "title": "MIT course number ascending",
        "sort": "course.course_numbers.sort_coursenum",
    },
    "-mitcoursenumber": {
        "title": "MIT course number descending",
        "sort": "-course.course_numbers.sort_coursenum",
    },
}
