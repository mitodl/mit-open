from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAdminUser

from articles.models import Article
from articles.serializers import ArticleSerializer
from open_discussions.constants import VALID_HTTP_METHODS

# Create your views here.


class DefaultPagination(LimitOffsetPagination):
    """
    Pagination class for learning_resources viewsets which gets default_limit and max_limit from settings
    """  # noqa: E501

    default_limit = 10
    max_limit = 100


@extend_schema_view(
    list=extend_schema(summary="List"),
    retrieve=extend_schema(summary="Retrieve"),
    create=extend_schema(summary="Create"),
    destroy=extend_schema(summary="Destroy"),
    partial_update=extend_schema(summary="Partial Update"),
)
class ArticleViewSet(viewsets.ModelViewSet):
    """
    Viewset for Article viewing and editing.
    """

    serializer_class = ArticleSerializer
    queryset = Article.objects.all()
    pagination_class = DefaultPagination

    permission_classes = [IsAdminUser]
    http_method_names = VALID_HTTP_METHODS
