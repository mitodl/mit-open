"""ETL pipelines"""

from toolz import compose, curry

from course_catalog.etl import (
    loaders,
    video,
    youtube,
)

# A few notes on how this module works:
#
# - Each pipeline is composed right-to-left
# - We define normalized loaders of data in loaders.py
# - Each integration must define an extraction function to fetch the data
# - Each integration must define an transformation function to normalize the data
# - Additional specifics are commented on as needed

load_programs = curry(loaders.load_programs)
load_courses = curry(loaders.load_courses)


youtube_etl = compose(loaders.load_video_channels, youtube.transform, youtube.extract)

# pipeline for generating topic data for videos based on course topics
video_topics_etl = compose(loaders.load_videos, video.extract_videos_topics)
