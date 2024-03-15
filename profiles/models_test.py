"""Tests for profile model"""

import pytest
from django.core.files.uploadedfile import UploadedFile
from django.db import connection

from profiles.factories import ProgramCertificateFactory, ProgramLetterFactory
from profiles.models import (
    PERSONAL_SITE_TYPE,
    SITE_TYPE_OPTIONS,
    SOCIAL_SITE_NAME_MAP,
)


@pytest.mark.parametrize("update_image", [True, False])
def test_image_update(user, profile_image, update_image):
    """
    Test that small and medium images are created only when update_image is True
    """
    profile = user.profile
    image_size = len(profile_image.getvalue())
    profile.image_file = UploadedFile(
        profile_image, "filename.png", "image/png", image_size
    )
    profile.image_small_file = None
    profile.image_medium_file = None
    profile.save(update_image=update_image)
    assert (profile.image_medium_file.name is not None) is update_image
    medium_size = len(profile.image_medium_file.read()) if update_image else 1
    assert medium_size != image_size
    assert (profile.image_small_file.name is not None) is update_image
    small_size = len(profile.image_small_file.read()) if update_image else 0
    assert small_size < medium_size


def test_null_image(user):
    """
    If the main image is null the thumbnails should be too
    """
    profile = user.profile
    assert profile.image_small_file is not None
    assert profile.image_medium_file is not None
    profile.image_file = None
    profile.save(update_image=True)
    assert not profile.image_file
    assert not profile.image_medium_file
    assert not profile.image_small_file


def test_social_site_name_map():
    """
    Test that all social sites are represented with a human-friendly name
    """
    social_site_type_options = set(SITE_TYPE_OPTIONS)
    social_site_type_options.remove(PERSONAL_SITE_TYPE)
    assert social_site_type_options == set(SOCIAL_SITE_NAME_MAP.keys())


@pytest.mark.django_db()
def test_external_schema_exists():
    """
    Test that our migrations have created a seperate schema
    for storing our external readonly tables
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'external';
            """
        )
        assert cursor.fetchone()[0] == "external"


@pytest.mark.django_db()
def test_program_letter_model_strings(user, settings):
    """
    Test that ProgramCertificate and ProgramLetter string methods
    return what we expect
    """
    settings.DATABASE_ROUTERS = []
    cert = ProgramCertificateFactory(
        user_full_name="test user", program_title="test program"
    )
    letter = ProgramLetterFactory(user=user, certificate=cert)
    assert str(cert) == "program certificate: test user - test program"
    assert str(letter) == "program letter: test user - test program"
