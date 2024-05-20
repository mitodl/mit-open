import math
from time import time
from typing import Optional

import jwt
from django.conf import settings
from rest_framework import serializers


class CKEditorSettingsSerializer(serializers.Serializer):
    """Serializer for CKEditor settings"""

    token = serializers.SerializerMethodField()

    def get_token(self, _value) -> Optional[str]:
        """Get the JWT token"""
        if settings.CKEDITOR_SECRET_KEY and settings.CKEDITOR_ENVIRONMENT_ID:
            payload = {
                "iss": settings.CKEDITOR_ENVIRONMENT_ID,
                "iat": math.floor(time()),
            }
            return jwt.encode(payload, settings.CKEDITOR_SECRET_KEY, algorithm="HS256")
        return None
