import pytest

from main.routers import ReadOnlyModelError
from profiles.factories import ProgramCertificateFactory


def test_external_tables_are_readonly():
    """
    Test that external tables cannot be written to
    """
    with pytest.raises(ReadOnlyModelError):
        ProgramCertificateFactory(user_email="test@test.com", program_title="test")
