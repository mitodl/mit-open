from django.apps import AppConfig

from main import features

class MainConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "main"

    def ready(self):
        features.configure()

