"""Personalization views"""

from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from personalization.models import Personalization
from personalization.serializers import PersonalizationSerializer


class PersonalizationViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """ViewSet for personalizations"""

    permission_classes = [IsAuthenticated]
    model = Personalization
    serializer_class = PersonalizationSerializer
