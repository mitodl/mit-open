"""
course_catalog permissions tests
"""
import pytest
from django.contrib.auth.models import AnonymousUser
from django.http import Http404

from learning_resources.factories import LearningPathFactory
from learning_resources.permissions import (
    HasLearningPathItemPermissions,
    HasLearningPathPermissions,
    is_learning_path_editor,
)
from learning_resources.utils import update_editor_group
from open_discussions.factories import UserFactory


@pytest.fixture(autouse=True)
def drf_settings(settings):
    """Default drf prefix setting"""
    settings.DRF_NESTED_PARENT_LOOKUP_PREFIX = ""


@pytest.mark.parametrize("is_safe", [True, False])
@pytest.mark.parametrize("is_anonymous", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
def test_learningpath_permissions(mocker, user, is_safe, is_anonymous, is_editor):
    """
    HasLearningPathPermissions.has_permission should always return True for safe (GET) requests,
    should return False for anonymous users if request is a POST
    """
    update_editor_group(user, (is_editor and not is_anonymous))
    request = mocker.MagicMock(
        method="GET" if is_safe else "POST",
        user=(AnonymousUser() if is_anonymous else user),
    )
    assert is_learning_path_editor(request) is (is_editor and not is_anonymous)
    assert HasLearningPathPermissions().has_permission(request, mocker.MagicMock()) is (
        is_safe or (is_editor and not is_anonymous)
    )


@pytest.mark.parametrize("is_public", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
def test_learningpath_object_permissions(mocker, user, is_public, is_editor):
    """
    HasLearningPathPermissions.has_object_permission should return correct permission depending
    on privacy level and editor group membership.
    """
    learningpath = LearningPathFactory.create(
        author=UserFactory.create(),
        is_unpublished=not is_public,
    )

    update_editor_group(user, is_editor)

    request = mocker.MagicMock(method="GET", user=user)
    assert HasLearningPathPermissions().has_object_permission(
        request, mocker.MagicMock(), learningpath.learning_resource
    ) is (is_public or is_editor)


def test_learningpathitems_permissions_404(mocker, user):
    """
    HasLearningPathPermissions.has_permission should return a 404 if the learningpath doesn't exist.
    """
    request = mocker.MagicMock(method="GET", user=user)

    view = mocker.MagicMock(kwargs={"parent_id": 99999})
    with pytest.raises(Http404):
        HasLearningPathItemPermissions().has_permission(request, view)


@pytest.mark.parametrize("is_editor", [True, False])
@pytest.mark.parametrize("is_public", [True, False])
@pytest.mark.parametrize("is_safe", [True, False])
def test_learningpathitems_permissions(mocker, user, is_safe, is_public, is_editor):
    """
    HasUserListItemPermissions.has_permission should return correct permission depending
    on privacy level, author, and request method.
    """
    update_editor_group(user, is_editor)

    learningpath = LearningPathFactory.create(
        author=UserFactory.create(),
        is_unpublished=not is_public,
    )
    request = mocker.MagicMock(method="GET" if is_safe else "POST", user=user)

    view = mocker.MagicMock(kwargs={"parent_id": learningpath.learning_resource.id})
    assert HasLearningPathItemPermissions().has_permission(request, view) is (
        is_editor or (is_safe and is_public)
    )


@pytest.mark.parametrize("is_safe", [True, False])
@pytest.mark.parametrize("is_public", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
def test_learningpathitems_object_permissions(
    mocker, user, is_public, is_editor, is_safe
):
    """
    HasUserListItemPermissions.has_object_permission should return correct permission depending
    on privacy level, author, and request method.
    """
    learningpath = LearningPathFactory.create(
        author=UserFactory.create(),
        is_unpublished=not is_public,
    )
    learningpath_item = learningpath.learning_resource.children.first()

    update_editor_group(user, is_editor)
    request = mocker.MagicMock(
        method="GET" if is_safe else "POST",
        user=user,
    )
    view = mocker.MagicMock(kwargs={"parent_id": learningpath.learning_resource.id})
    assert HasLearningPathItemPermissions().has_object_permission(
        request, view, learningpath_item
    ) is (is_editor or (is_safe and is_public))
