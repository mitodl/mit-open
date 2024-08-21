from django.conf import settings


class ReadOnlyModelError(Exception):
    """Raised when a write was attempted on a read-only model"""


class ReadReplicaDatabaseRouter:
    def db_for_read(self, model, **meta):  # noqa: ARG002
        if (
            settings.DATABASES.get("read_replica")
            and model._meta.app_label in settings.REPLICA_ROUTED_APPS  # noqa: SLF001
        ):
            return "read_replica"
        return None


class ExternalSchemaRouter:
    def db_for_write(self, model, **meta):  # noqa: ARG002
        model_name = model._meta.model_name  # noqa: SLF001
        if model_name in settings.EXTERNAL_MODELS:
            exception_message = f"model {model_name} is read only"
            raise ReadOnlyModelError(exception_message)


class ApplicationDatabaseRouter(ReadReplicaDatabaseRouter, ExternalSchemaRouter):
    pass
