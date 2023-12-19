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
    list=extend_schema(summary="List", description="Get a paginated list of articles"),
    retrieve=extend_schema(summary="Retrieve", description="Retrieve a single article"),
    create=extend_schema(summary="Create", description="Create a new article"),
    destroy=extend_schema(summary="Destroy", description="Delete an article"),
    partial_update=extend_schema(summary="Update", description="Update an article"),
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
