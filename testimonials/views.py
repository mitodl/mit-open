"""Views for testimonials."""

from random import shuffle

from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from learning_resources.views import LargePagination
from main.filters import MultipleOptionsFilterBackend
from main.permissions import AnonymousAccessReadonlyPermission
from main.utils import now_in_utc
from testimonials.filters import AttestationFilter
from testimonials.models import Attestation
from testimonials.serializers import AttestationSerializer


class FeaturedTestimonialsPagination(LargePagination):
    """Overrides the get_paginated_response to ensure the count is right."""

    def get_paginated_response(self, data):
        """Return the paginated response."""

        return Response(
            {
                "count": len(data),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )


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


@extend_schema_view(
    list=extend_schema(
        summary="List",
        description="List featured testimonials.",
        responses=AttestationSerializer(),
    ),
)
class FeaturedAttestationViewSet(AttestationViewSet):
    """
    Shows featured attestations for offerors.

    Featured attestations are displayed according to these rules:
    - An attestation is regarded as "featured" if its position is 1.
    - Only one featured attestation is displayed per offeror.

    The attestations are randomized before selecting for the offeror.
    """

    pagination_class = FeaturedTestimonialsPagination
    queryset = (
        Attestation.objects.filter(
            Q(publish_date__isnull=True) | Q(publish_date__lte=now_in_utc())
        )
        .prefetch_related("offerors", "channels")
        .filter(position=1)
    )

    @staticmethod
    def _randomize_results(results):
        """
        Randomize the results within each offeror.

        This differs slightly from the one in learning_resources.views.FeaturedViewSet
        in that we just want the first one off the list per offeror.
        """
        if len(results) == 0:
            return results

        results_by_offeror = {}
        randomized_results = []

        for result in results:
            [
                results_by_offeror.setdefault(offeror.code, []).append(result)
                for offeror in result.offerors.all()
            ]

        for offeror in sorted(results_by_offeror.keys()):
            shuffle(results_by_offeror[offeror])

            # Make sure we're not duplicating the testimonial here - you can
            # assign an attestation to >1 offeror.

            random_attestation = None

            while not random_attestation or random_attestation in randomized_results:
                random_attestation = results_by_offeror[offeror].pop()

            randomized_results.append(random_attestation)

        return randomized_results

    @extend_schema(
        summary="List",
        description="Get a paginated list of featured testimonials",
    )
    def list(self, request, *args, **kwargs):  # noqa: ARG002
        """Get a paginated list of featured testimonials"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(self._randomize_results(page), many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(self._randomize_results(queryset), many=True)
        return Response(serializer.data)
