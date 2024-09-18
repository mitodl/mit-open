"""Tests for mit_edx_programs"""

import pytest

from learning_resources.etl.mit_edx_programs import transform


@pytest.mark.django_db
def test_mitx_transform_mit_owner(mitx_programs_data):
    """Verify that only non-micromasters programs with MIT owners are returned"""
    transformed = list(transform(mitx_programs_data))
    assert len(transformed) == 1
    assert transformed[0]["title"] == "Circuits and Electronics"
