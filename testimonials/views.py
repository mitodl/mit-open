"""Views for testimonials."""

from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.viewsets import ReadOnlyModelViewSet

from learning_resources.views import LargePagination
from main.filters import MultipleOptionsFilterBackend
from main.permissions import AnonymousAccessReadonlyPermission
from main.utils import now_in_utc
from testimonials.filters import AttestationFilter
from testimonials.models import Attestation
from testimonials.serializers import AttestationSerializer


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
    queryset = (
        Attestation.objects.filter(
            Q(publish_date__isnull=True) | Q(publish_date__lte=now_in_utc())
        )
        .order_by("position", "-updated_on")
        .all()
    )
    pagination_class = LargePagination
    filter_backends = [MultipleOptionsFilterBackend]
    filterset_class = AttestationFilter
    permission_classes = [AnonymousAccessReadonlyPermission]
