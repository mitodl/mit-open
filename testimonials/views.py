"""Views for testimonials."""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.viewsets import ReadOnlyModelViewSet

from learning_resources.views import LargePagination
from main.filters import MultipleOptionsFilterBackend
from testimonials.filters import AttestationFilter
from testimonials.models import Attestation
from testimonials.serializers import AttestationSerializer

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="List",
        description="List all testimonials.",
        responses=AttestationSerializer(),
    ),
    retrieve=extend_schema(
        summary="Retrieve",
        description="Retrieve a testimonial.",
        responses=AttestationSerializer(),
    ),
)
class AttestationViewSet(ReadOnlyModelViewSet):
    """Viewset for attestations."""

    serializer_class = AttestationSerializer
    queryset = Attestation.objects.all()
    pagination_class = LargePagination
    filter_backends = [MultipleOptionsFilterBackend]
    filterset_class = AttestationFilter
