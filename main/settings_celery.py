"""
Django settings for celery.
"""

from celery.schedules import crontab

from main.envs import get_bool, get_int, get_string

USE_CELERY = True
CELERY_BROKER_URL = get_string("CELERY_BROKER_URL", get_string("REDISCLOUD_URL", None))
CELERY_RESULT_BACKEND = get_string(
    "CELERY_RESULT_BACKEND", get_string("REDISCLOUD_URL", None)
)
CELERY_TASK_ALWAYS_EAGER = get_bool("CELERY_TASK_ALWAYS_EAGER", False)  # noqa: FBT003
CELERY_TASK_EAGER_PROPAGATES = get_bool(
    "CELERY_TASK_EAGER_PROPAGATES",
    True,  # noqa: FBT003
)
CELERY_WORKER_MAX_MEMORY_PER_CHILD = get_int(
    "CELERY_WORKER_MAX_MEMORY_PER_CHILD", 250_000
)

CELERY_BEAT_SCHEDULE = {
    "update_next-start-date-every-1-days": {
        "task": "learning_resources.tasks.update_next_start_date",
        "schedule": crontab(minute=0, hour=4),  # midnight EST
    },
    "update_edx-courses-every-1-days": {
        "task": "learning_resources.tasks.get_mit_edx_data",
        "schedule": crontab(minute=30, hour=15),  # 11:30am EST
    },
    "update-edx-files-every-1-weeks": {
        "task": "learning_resources.tasks.import_all_mit_edx_files",
        "schedule": crontab(
            minute=0, hour=16, day_of_week=1
        ),  # 12:00 PM EST on Mondays
    },
    "update-micromasters-programs-every-1-days": {
        "task": "learning_resources.tasks.get_micromasters_data",
        "schedule": crontab(minute=30, hour=16),
    },
    "update-mitxonline-courses-every-1-days": {
        "task": "learning_resources.tasks.get_mitxonline_data",
        "schedule": crontab(minute=30, hour=19),  # 3:30pm EST
    },
    "update-mitxonline-files-every-1-weeks": {
        "task": "learning_resources.tasks.import_all_mitxonline_files",
        "schedule": crontab(
            minute=0, hour=16, day_of_week=3
        ),  # 12:00 PM EST on Wednesdays
    },
    "update-oll-courses-every-1-days": {
        "task": "learning_resources.tasks.get_oll_data",
        "schedule": crontab(minute=30, hour=18),  # 2:30pm EST
    },
    "update-podcasts": {
        "task": "learning_resources.tasks.get_podcast_data",
        "schedule": get_int(
            "PODCAST_FETCH_SCHEDULE_SECONDS", 60 * 60 * 2
        ),  # default is every 2 hours
    },
    "update-prolearn-courses-every-1-days": {
        "task": "learning_resources.tasks.get_prolearn_data",
        "schedule": crontab(minute=30, hour=21),  # 5:30pm EST
    },
    "update-xpro-courses-every-1-days": {
        "task": "learning_resources.tasks.get_xpro_data",
        "schedule": crontab(minute=30, hour=17),  # 1:30pm EST
    },
    "update-xpro-files-every-1-weeks": {
        "task": "learning_resources.tasks.import_all_xpro_files",
        "schedule": crontab(
            minute=0, hour=16, day_of_week=2
        ),  # 12:00 PM EST on Tuesdays
    },
    "update-youtube-videos": {
        "task": "learning_resources.tasks.get_youtube_data",
        "schedule": get_int(
            "YOUTUBE_FETCH_SCHEDULE_SECONDS", 60 * 30
        ),  # default is every 30 minutes
    },
    "update-youtube-transcripts": {
        "task": "learning_resources.tasks.get_youtube_transcripts",
        "schedule": get_int(
            "YOUTUBE_FETCH_TRANSCRIPT_SCHEDULE_SECONDS", 60 * 60 * 12
        ),  # default is 12 hours
    },
    "update_medium_mit_news": {
        "task": "news_events.tasks.get_medium_mit_news",
        "schedule": get_int(
            "NEWS_EVENTS_MEDIUM_NEWS_SCHEDULE_SECONDS", 60 * 60 * 3
        ),  # default is every 3 hours
    },
    "update_sloan_news": {
        "task": "news_events.tasks.get_sloan_exec_news",
        "schedule": get_int(
            "NEWS_EVENTS_SLOAN_EXEC_NEWS_SCHEDULE_SECONDS", 60 * 60 * 3
        ),  # default is every 3 hours
    },
    "update_ol_events": {
        "task": "news_events.tasks.get_ol_events",
        "schedule": get_int(
            "NEWS_EVENTS_OL_EVENTS_SCHEDULE_SECONDS", 60 * 60 * 3
        ),  # default is every 3 hours
    },
    "update_posthog_events": {
        "task": "learning_resources.tasks.get_learning_resource_views",
        "schedule": get_int(
            "NEWS_EVENTS_OL_EVENTS_SCHEDULE_SECONDS", 60 * 60 * 3
        ),  # default is every 3 hours
    },
    "send-subscription-emails-every-1-days": {
        "task": "learning_resources_search.tasks.send_subscription_emails",
        "schedule": crontab(minute=30, hour=18),  # 2:30pm EST
        "kwargs": {"period": "daily", "subscription_type": "channel_subscription_type"},
    },
}


CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TASK_TRACK_STARTED = True
CELERY_TASK_SEND_SENT_EVENT = True
