"""Utility functions for testimonials."""

from main.utils import generate_filepath


def avatar_uri(instance, filename):
    """
    upload_to handler for Channel.avatar
    """
    return generate_filepath(
        filename, instance.attestant_name, "_avatar", "testimonial"
    )


def cover_uri(instance, filename):
    """
    upload_to handler for Channel.avatar
    """
    return generate_filepath(filename, instance.attestant_name, "_cover", "testimonial")
