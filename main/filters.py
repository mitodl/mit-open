"""Common filter classes and functions"""

import logging
from typing import Any

from django.db.models import Q, QuerySet
from django_filters import BaseInFilter, CharFilter, MultipleChoiceFilter, NumberFilter
from django_filters.rest_framework import DjangoFilterBackend

log = logging.getLogger(__name__)


def decomma(value: Any) -> Any:
    """URL-encode commas"""
    if isinstance(value, str):
        return value.replace(",", "%2C")
    return value


def recomma(value: Any) -> Any:
    """URL-decode commas"""
    if isinstance(value, str):
        return value.replace(
            "%2C",
            ",",
        )
    return value


def multi_or_filter(
    queryset: QuerySet, attribute: str, values: list[str or list]
) -> QuerySet:
    """Filter attribute by value string with n comma-delimited values"""
    query_or_filters = Q()
    for query in [Q(**{attribute: recomma(value)}) for value in values]:
        query_or_filters |= query
    return queryset.filter(query_or_filters)


class CharInFilter(BaseInFilter, CharFilter):
    """Filter that allows for multiple character values"""


class NumberInFilter(BaseInFilter, NumberFilter):
    """Filter that allows for multiple numeric values"""


class MultipleOptionsFilterBackend(DjangoFilterBackend):
    """
    Custom filter backend that handles multiple values for the same key
    in various formats
    """

    def get_filterset_kwargs(self, request, queryset, view):  # noqa: ARG002
        """
        Adjust the query parameters to handle multiple values for the same key,
        regardless of whether they are in the form 'key=x&key=y' or 'key=x,y'
        """
        query_params = request.query_params.copy()
        for key in query_params:
            filter_key = request.parser_context[
                "view"
            ].filterset_class.base_filters.get(key)
            if filter_key:
                values = query_params.getlist(key)
                if isinstance(filter_key, MultipleChoiceFilter):
                    split_values = [
                        value.split(",") for value in query_params.getlist(key)
                    ]
                    values = [value for val_list in split_values for value in val_list]
                    query_params.setlist(key, values)
                elif isinstance(filter_key, CharInFilter | NumberInFilter):
                    query_params[key] = ",".join([decomma(value) for value in values])
        return {
            "data": query_params,
            "queryset": queryset,
            "request": request,
        }
