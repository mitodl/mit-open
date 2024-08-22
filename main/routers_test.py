import pytest

import learning_resources.models as learning_resource_models
from main.routers import ApplicationDatabaseRouter, ReadOnlyModelError
from profiles.factories import ProgramCertificateFactory


def test_external_tables_are_readonly():
    """
    Test that external tables cannot be written to
    """
    with pytest.raises(ReadOnlyModelError):
        ProgramCertificateFactory(user_email="test@test.com", program_title="test")


def test_application_database_router(settings):
    """
    Test that learning resource models route reads to the replica
    """
    settings.DATABASES["read_replica"] = {
        "NAME": "replica",
        "USER": "postgres",
        "PASSWORD": "postgres",
        "HOST": "db",
        "PORT": 5432,
        "CONN_MAX_AGE": 0,
        "CONN_HEALTH_CHECKS": False,
        "DISABLE_SERVER_SIDE_CURSORS": False,
        "ENGINE": "django.db.backends.postgresql",
        "OPTIONS": {},
        "ATOMIC_REQUESTS": False,
        "AUTOCOMMIT": True,
        "TIME_ZONE": None,
    }
    lr_models = [
        learning_resource_models.LearningResourcePlatform,
        learning_resource_models.LearningResourceTopic,
        learning_resource_models.LearningResourceOfferor,
        learning_resource_models.LearningResourceTopicMapping,
        learning_resource_models.LearningResourceImage,
        learning_resource_models.LearningResourceSchool,
        learning_resource_models.LearningResourceDepartment,
        learning_resource_models.LearningResourceContentTag,
        learning_resource_models.LearningResourceInstructor,
        learning_resource_models.LearningResource,
        learning_resource_models.LearningResourceDetailModel,
        learning_resource_models.LearningResourceRun,
        learning_resource_models.LearningResourceRelationship,
        learning_resource_models.ContentFile,
        learning_resource_models.UserList,
        learning_resource_models.UserListRelationship,
        learning_resource_models.VideoChannel,
        learning_resource_models.LearningResourceViewEvent,
    ]
    router = ApplicationDatabaseRouter()
    for model in lr_models:
        # Test the db used for read is the replica
        assert router.db_for_read(model) == "read_replica"
        # Test the db used for write is the default one
        assert router.db_for_write(model) is None
