from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAdminUser

from staff_posts.models import StaffPost
from staff_posts.serializers import StaffPostSerializer

# Create your views here.


class DefaultPagination(LimitOffsetPagination):
    """
    Pagination class for learning_resources viewsets which gets default_limit and max_limit from settings
    """  # noqa: E501

    default_limit = 10
    max_limit = 100


class StaffPostViewSet(viewsets.ModelViewSet):
    """
    Viewset for StaffPost viewing and editing.
    """

    serializer_class = StaffPostSerializer
    queryset = StaffPost.objects.all()
    pagination_class = DefaultPagination

    permission_classes = [IsAdminUser]
