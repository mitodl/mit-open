from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAdminUser

from articles.models import Article
from articles.serializers import ArticleSerializer

# Create your views here.


class DefaultPagination(LimitOffsetPagination):
    """
    Pagination class for learning_resources viewsets which gets default_limit and max_limit from settings
    """  # noqa: E501

    default_limit = 10
    max_limit = 100


class ArticleViewSet(viewsets.ModelViewSet):
    """
    Viewset for Article viewing and editing.
    """

    serializer_class = ArticleSerializer
    queryset = Article.objects.all()
    pagination_class = DefaultPagination

    permission_classes = [IsAdminUser]
