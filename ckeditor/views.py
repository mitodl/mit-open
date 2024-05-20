"""CKEditor views"""

from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from ckeditor.serializers import CKEditorSettingsSerializer
from main.permissions import AnonymousAccessReadonlyPermission


class CKEditorSettingsView(APIView):
    """Get the settings for CKEditor"""

    permission_classes = [AnonymousAccessReadonlyPermission]

    @extend_schema(responses=CKEditorSettingsSerializer())
    def get(self, request, format=None):  # noqa: ARG002, A002
        """Get the settings response"""
        return Response(CKEditorSettingsSerializer({}).data)
