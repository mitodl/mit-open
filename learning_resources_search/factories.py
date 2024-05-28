import random

import factory
from factory.django import DjangoModelFactory

from learning_resources_search import models


class PercolateQueryFactory(DjangoModelFactory):
    original_query = factory.Dict(
        {
            "q": factory.Faker("text", max_nb_chars=50),
            "free": None,
            "endpoint": "learning_resource",
            "professional": None,
            "certification": None,
            "topic": [
                random.choice(  # noqa: S311
                    [
                        "Business",
                        "Mechanical Engineering",
                        "Environmental Engineering",
                        "Computer Science",
                        "Entrepreneurship",
                        "Systems Engineering",
                        "Communications",
                        "Marketing",
                        "Management",
                    ]
                )
            ],
        }
    )

    query = {
        "bool": {
            "must": [{"exists": {"field": "resource_type"}}],
            "filter": [
                {
                    "bool": {
                        "must": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "course",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        },
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "program",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        },
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "podcast",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        },
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "podcast_episode",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        },
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "learning_path",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        },
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "video",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        },
                                        {
                                            "term": {
                                                "resource_type": {
                                                    "value": "video_playlist",
                                                    "case_insensitive": True,
                                                }
                                            }
                                        },
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "nested": {
                                                "path": "topics",
                                                "query": {
                                                    "term": {
                                                        "topics.name": {
                                                            "value": "Physics",
                                                            "case_insensitive": True,
                                                        }
                                                    }
                                                },
                                            }
                                        }
                                    ]
                                }
                            },
                        ]
                    }
                }
            ],
        }
    }

    class Meta:
        model = models.PercolateQuery
