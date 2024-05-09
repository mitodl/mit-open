"""Views for testimonials."""

from django.contrib.auth import get_user_model
from rest_framework.viewsets import ReadOnlyModelViewSet

from testimonials.models import Attestation
from testimonials.serializers import AttestationSerializer

User = get_user_model()


class AttestationViewSet(ReadOnlyModelViewSet):
    """Viewset for attestations."""

    serializer_class = AttestationSerializer
    queryset = Attestation.objects.all()
