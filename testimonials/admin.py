"""Django Admin setup for the app."""

from django.contrib import admin

from testimonials.models import Attestation


class AttestationAdmin(admin.ModelAdmin):
    """Admin for attestation records."""

    model = Attestation
    search_fields = ("attestant_name", "title")
    list_display = ("title", "attestant_name")


admin.site.register(Attestation, AttestationAdmin)
