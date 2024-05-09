"""Views for testimonials."""

from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from learning_resources.views import LargePagination
from main.filters import MultipleOptionsFilterBackend
from main.utils import now_in_utc
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
    published=extend_schema(
        summary="List published testimonials.",
        description=(
            "Published testimonials have a publish date of null or a"
            " datetime that's in the past."
        ),
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

    @action(detail=False)
    def published(self, request):  # noqa: ARG002
        """Return only published testimonials."""

        published = self.queryset.filter(
            Q(publish_date__isnull=True) | Q(publish_date__lte=now_in_utc())
        )

        page = self.paginate_queryset(published)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(published, many=True)
        return Response(serializer.data)
