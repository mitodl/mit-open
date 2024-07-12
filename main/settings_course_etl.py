"""
Django settings specific to learning_resources ingestion
"""

from main.envs import get_bool, get_int, get_string

# EDX API Credentials
EDX_API_URL = get_string("EDX_API_URL", None)
EDX_API_ACCESS_TOKEN_URL = get_string("EDX_API_ACCESS_TOKEN_URL", None)
EDX_API_CLIENT_ID = get_string("EDX_API_CLIENT_ID", None)
EDX_API_CLIENT_SECRET = get_string("EDX_API_CLIENT_SECRET", None)
EDX_LEARNING_COURSE_BUCKET_NAME = get_string("EDX_LEARNING_COURSE_BUCKET_NAME", None)
EDX_LEARNING_COURSE_BUCKET_PREFIX = get_string(
    "EDX_LEARNING_COURSE_BUCKET_PREFIX", "simeon-mitx-course-tarballs"
)
# Authentication for the github api
GITHUB_ACCESS_TOKEN = get_string("GITHUB_ACCESS_TOKEN", None)

# OCW settings
OCW_LIVE_BUCKET = get_string("OCW_LIVE_BUCKET", None)
OCW_ITERATOR_CHUNK_SIZE = get_int("OCW_ITERATOR_CHUNK_SIZE", 1000)
OCW_SKIP_CONTENT_FILES = get_bool("OCW_SKIP_CONTENT_FILES", default=False)
OCW_WEBHOOK_KEY = get_string("OCW_WEBHOOK_KEY", None)
MAX_S3_GET_ITERATIONS = get_int("MAX_S3_GET_ITERATIONS", 3)


# Base URL's for courses
OCW_BASE_URL = get_string("OCW_BASE_URL", "http://ocw.mit.edu/")
EDX_BASE_URL = get_string("EDX_BASE_URL", "https://www.edx.org/")
EDX_ALT_URL = get_string("EDX_ALT_URL", "https://courses.edx.org/")
BLOCKLISTED_COURSES_URL = get_string(
    "BLOCKLISTED_COURSES_URL",
    "https://raw.githubusercontent.com/mitodl/open-resource-blocklists/master/courses.txt",
)
DUPLICATE_COURSES_URL = get_string("DUPLICATE_COURSES_URL", None)

# Base URL for Micromasters data
MICROMASTERS_CATALOG_API_URL = get_string("MICROMASTERS_CATALOG_API_URL", None)

# Base URL for Prolearn data
PROLEARN_CATALOG_API_URL = get_string("PROLEARN_CATALOG_API_URL", None)

# Iterator chunk size for MITx and xPRO courses
LEARNING_COURSE_ITERATOR_CHUNK_SIZE = get_int("LEARNING_COURSE_ITERATOR_CHUNK_SIZE", 20)

# xPRO settings for course/resource ingestion
XPRO_LEARNING_COURSE_BUCKET_NAME = get_string("XPRO_LEARNING_COURSE_BUCKET_NAME", None)
XPRO_CATALOG_API_URL = get_string("XPRO_CATALOG_API_URL", None)
XPRO_COURSES_API_URL = get_string("XPRO_COURSES_API_URL", None)

# MITx Online settings for course/resource ingestion
MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME = get_string(
    "MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME", None
)
MITX_ONLINE_BASE_URL = get_string("MITX_ONLINE_BASE_URL", None)
MITX_ONLINE_PROGRAMS_API_URL = get_string("MITX_ONLINE_PROGRAMS_API_URL", None)
MITX_ONLINE_COURSES_API_URL = get_string("MITX_ONLINE_COURSES_API_URL", None)

# Open Learning Library settings
OLL_API_URL = get_string("OLL_API_URL", None)
OLL_API_ACCESS_TOKEN_URL = get_string("OLL_API_ACCESS_TOKEN_URL", None)
OLL_API_CLIENT_ID = get_string("OLL_API_CLIENT_ID", None)
OLL_API_CLIENT_SECRET = get_string("OLL_API_CLIENT_SECRET", None)
OLL_BASE_URL = get_string("OLL_BASE_URL", None)
OLL_ALT_URL = get_string("OLL_ALT_URL", None)
OLL_LEARNING_COURSE_BUCKET_NAME = get_string("OLL_LEARNING_COURSE_BUCKET_NAME", None)
OLL_LEARNING_COURSE_BUCKET_PREFIX = get_string(
    "OLL_LEARNING_COURSE_BUCKET_PREFIX", "open-learning-library/courses"
)
# More MIT URLs
SEE_BASE_URL = get_string("SEE_BASE_URL", None)
MITPE_BASE_URL = get_string("MITPE_BASE_URL", None)
CSAIL_BASE_URL = get_string("CSAIL_BASE_URL", None)

# course catalog video etl settings
OPEN_VIDEO_DATA_BRANCH = get_string("OPEN_VIDEO_DATA_BRANCH", "master")
OPEN_VIDEO_USER_LIST_OWNER = get_string("OPEN_VIDEO_USER_LIST_OWNER", None)
OPEN_VIDEO_MAX_TOPICS = get_int("OPEN_VIDEO_MAX_TOPICS", 3)
OPEN_VIDEO_MIN_TERM_FREQ = get_int("OPEN_VIDEO_MIN_TERM_FREQ", 1)
OPEN_VIDEO_MIN_DOC_FREQ = get_int("OPEN_VIDEO_MIN_DOC_FREQ", 15)

YOUTUBE_DEVELOPER_KEY = get_string("YOUTUBE_DEVELOPER_KEY", None)
YOUTUBE_CONFIG_URL = get_string("YOUTUBE_CONFIG_URL", None)

# course catalog podcast etl settings
OPEN_PODCAST_DATA_BRANCH = get_string("OPEN_PODCAST_DATA_BRANCH", "master")

# Tika settings
TIKA_ACCESS_TOKEN = get_string("TIKA_ACCESS_TOKEN", None)
TIKA_TIMEOUT = get_int("TIKA_TIMEOUT", 60)
TIKA_OCR_STRATEGY = get_string("TIKA_OCR_STRATEGY", "no_ocr")
