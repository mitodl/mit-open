"""admin for learning_resources"""

from django.contrib import admin

from learning_resources_search import models


class PercolateQueryAdmin(admin.ModelAdmin):
    """PercolateQuery Admin"""

    model = models.PercolateQuery
    list_display = ("original_query", "query")
    search_fields = ("original_query", "query")


admin.site.register(models.PercolateQuery, PercolateQueryAdmin)
