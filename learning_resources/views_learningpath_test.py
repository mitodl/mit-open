"""Tests for learning_resources LearningPath views"""

from types import SimpleNamespace

import pytest
from django.urls import reverse

from learning_resources import factories, models
from learning_resources.constants import (
    LearningResourceRelationTypes,
)
from learning_resources.utils import update_editor_group
from main.factories import UserFactory

# pylint:disable=redefined-outer-name,unused-argument


@pytest.fixture(autouse=True)
def mock_opensearch(mocker):
    """Mock opensearch tasks"""
    mock_upsert = mocker.patch(
        "learning_resources_search.tasks.upsert_learning_resource"
    )
    mock_upsert_immutable_signature = mocker.patch(
        "learning_resources_search.tasks.upsert_learning_resource.si"
    )
    mock_deindex = mocker.patch("learning_resources_search.tasks.deindex_document")
    return SimpleNamespace(
        upsert=mock_upsert,
        deindex=mock_deindex,
        upsert_si=mock_upsert_immutable_signature,
    )


@pytest.mark.parametrize("is_public", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
@pytest.mark.parametrize("has_image", [True, False])
def test_learning_path_endpoint_get(client, user, is_public, is_editor, has_image):
    """Test learning path endpoint"""
    update_editor_group(user, is_editor)

    learning_path_res = factories.LearningResourceFactory.create(
        is_learning_path=True, published=is_public, no_image=not has_image
    )
    assert learning_path_res.published == is_public

    another_learning_path_res = factories.LearningResourceFactory.create(
        is_learning_path=True,
        published=is_public,
    )

    for idx, child in enumerate(learning_path_res.children.all()):
        models.LearningResourceRelationship.objects.filter(id=child.id).update(
            position=idx
        )

    if has_image:
        image_url = learning_path_res.image.url
    else:
        assert learning_path_res.image is None
        first_resource_child = (
            learning_path_res.children.order_by("position").first().child
        )
        image_url = first_resource_child.image.url

    # Anonymous users should get public results
    resp = client.get(reverse("lr:v1:learningpaths_api-list"))
    assert resp.data.get("count") == (2 if is_public else 0)

    # Logged in user should get public lists or all lists if editor
    client.force_login(user)
    resp = client.get(reverse("lr:v1:learningpaths_api-list"))
    assert resp.data["count"] == (2 if is_public or is_editor else 0)

    resp = client.get(
        reverse("lr:v1:learningpaths_api-detail", args=[learning_path_res.id])
    )
    assert resp.status_code == (404 if not (is_public or is_editor) else 200)
    if resp.status_code == 200:
        assert resp.data["title"] == learning_path_res.title
        assert (
            resp.data["learning_path"]["item_count"]
            == learning_path_res.children.count()
        )
        if has_image:
            assert resp.data["image"]["url"] == image_url
        else:
            assert resp.data["image"] is None

    # Logged in user should see other person's public list
    resp = client.get(
        reverse(
            "lr:v1:learningpaths_api-detail",
            args=[another_learning_path_res.id],
        )
    )
    assert resp.status_code == (404 if not is_public and not is_editor else 200)
    if resp.status_code == 200:
        assert resp.data.get("title") == another_learning_path_res.title


@pytest.mark.parametrize("is_published", [True, False])
@pytest.mark.parametrize("is_staff", [True, False])
@pytest.mark.parametrize("is_super", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
@pytest.mark.parametrize("is_anonymous", [True, False])
def test_learning_path_endpoint_create(  # pylint: disable=too-many-arguments  # noqa: PLR0913
    mock_opensearch,
    client,
    is_anonymous,
    is_published,
    is_staff,
    is_super,
    is_editor,
):
    """Test learningpath endpoint for creating a LearningPath"""
    user = UserFactory.create(is_staff=is_staff, is_superuser=is_super)
    update_editor_group(user, is_editor)

    if not is_anonymous:
        client.force_login(user)

    data = {
        "title": "My List",
        "description": "My Description",
        "published": is_published,
    }

    has_permission = not is_anonymous and (is_staff or is_super or is_editor)
    resp = client.post(
        reverse("lr:v1:learningpaths_api-list"), data=data, format="json"
    )
    assert resp.status_code == (201 if has_permission else 403)
    if resp.status_code == 201:
        assert resp.data.get("title") == resp.data.get("title")
        assert resp.data.get("description") == resp.data.get("description")
    assert mock_opensearch.upsert_si.call_count == (
        1 if has_permission and is_published else 0
    )


@pytest.mark.parametrize("is_public", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
@pytest.mark.parametrize("update_topics", [True, False])
def test_learning_path_endpoint_patch(
    mock_opensearch, client, update_topics, is_public, is_editor
):
    """Test learningpath endpoint for updating a LearningPath"""
    [original_topic, new_topic] = factories.LearningResourceTopicFactory.create_batch(2)
    user = UserFactory.create()
    update_editor_group(user, is_editor)
    learning_resource = factories.LearningResourceFactory.create(
        title="Title 1",
        topics=[original_topic],
        is_learning_path=True,
        learning_path__author=user,
        published=True,
    )
    factories.LearningPathRelationshipFactory.create(parent=learning_resource)

    client.force_login(user)

    data = {
        "title": "Title 2",
        "published": is_public,
    }

    if update_topics:
        data["topics"] = [new_topic.id]

    resp = client.patch(
        reverse("lr:v1:learningpaths_api-detail", args=[learning_resource.id]),
        data=data,
        format="json",
    )
    assert resp.status_code == (200 if is_editor else 403)
    if resp.status_code == 200:
        assert resp.data["title"] == "Title 2"
        assert resp.data["topics"][0]["id"] == (
            new_topic.id if update_topics else original_topic.id
        )
        assert mock_opensearch.upsert.call_count == (1 if is_public else 0)
        assert mock_opensearch.deindex.call_count == (1 if not is_public else 0)


@pytest.mark.parametrize("is_editor", [True, False])
def test_learning_path_items_endpoint_create_item(client, user, is_editor):
    """Test lr_learningpathitems_api endpoint for creating a LearningPath item"""
    learning_path = factories.LearningPathFactory.create()
    course = factories.CourseFactory.create()

    initial_count = learning_path.learning_resource.children.count()

    update_editor_group(user, is_editor)
    client.force_login(user)

    data = {"child": course.learning_resource.id}

    resp = client.post(
        reverse(
            "lr:v1:learningpathitems_api-list",
            args=[learning_path.learning_resource.id],
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == (201 if is_editor else 403)
    if resp.status_code == 201:
        assert resp.json().get("child") == course.learning_resource.id
        assert resp.json().get("position") == initial_count + 1

        item = models.LearningResourceRelationship.objects.get(id=resp.json().get("id"))
        assert (
            item.relation_type
            == LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
        )


def test_learning_path_items_endpoint_create_item_bad_data(client, user):
    """Test lr_learningpathitems_api endpoint for creating a LearningPath item w/bad data"""
    learning_path = factories.LearningPathFactory.create()

    update_editor_group(user, True)  # noqa: FBT003
    client.force_login(user)

    data = {"child": 999}

    resp = client.post(
        reverse(
            "lr:v1:learningpathitems_api-list",
            args=[learning_path.learning_resource.id],
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == 400
    assert resp.json() == {
        "child": ['Invalid pk "999" - object does not exist.'],
        "error_type": "ValidationError",
    }


@pytest.mark.parametrize(
    ("is_editor", "position"),
    [[True, 0], [True, 2], [False, 1]],  # noqa: PT007
)
def test_learning_path_items_endpoint_update_item_position(
    client, user, is_editor, position
):
    """Test lr_learningpathitems_api endpoint for updating LearningResourceRelationship positions"""
    learning_path = factories.LearningPathFactory.create()
    list_item_1 = factories.LearningPathRelationshipFactory.create(
        parent=learning_path.learning_resource, position=0
    )
    list_item_2 = factories.LearningPathRelationshipFactory.create(
        parent=learning_path.learning_resource, position=1
    )
    list_item_3 = factories.LearningPathRelationshipFactory.create(
        parent=learning_path.learning_resource, position=2
    )

    update_editor_group(user, is_editor)
    client.force_login(user)

    data = {"position": position}

    resp = client.patch(
        reverse(
            "lr:v1:learningpathitems_api-detail",
            args=[learning_path.learning_resource.id, list_item_2.id],
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == (200 if is_editor else 403)
    if resp.status_code == 200:
        assert resp.json()["position"] == position
        for item, expected_pos in (
            [list_item_3, 1 if position == 2 else 2],
            [list_item_1, 0 if position == 2 else 1],
            [list_item_2, position],
        ):
            item.refresh_from_db()
            assert item.position == expected_pos
            assert (
                item.relation_type
                == LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
            )


def test_learning_path_items_endpoint_update_items_wrong_list(client, user):
    """Verify that trying an update in wrong list fails"""
    learning_path = factories.LearningPathFactory.create()
    list_item_incorrect = factories.LearningPathRelationshipFactory.create()

    update_editor_group(user, True)  # noqa: FBT003
    client.force_login(user)

    data = {"position": 44}

    resp = client.patch(
        reverse(
            "lr:v1:learningpathitems_api-detail",
            args=[learning_path.learning_resource.id, list_item_incorrect.id],
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == 404


@pytest.mark.parametrize("num_items", [2, 3])
@pytest.mark.parametrize("is_editor", [True, False])
def test_learning_path_items_endpoint_delete_items(client, user, is_editor, num_items):
    """Test learningpathitems endpoint for deleting LearningPathItems"""
    learning_path = factories.LearningPathFactory.create()
    # Get rid of autogenerated children and recreate new ones
    learning_path.learning_resource.children.all().delete()
    list_items = sorted(
        factories.LearningPathRelationshipFactory.create_batch(
            num_items, parent=learning_path.learning_resource
        ),
        key=lambda item: item.position,
    )
    assert len(list_items) == num_items

    update_editor_group(user, is_editor)
    client.force_login(user)

    resp = client.delete(
        reverse(
            "lr:v1:learningpathitems_api-detail",
            args=[learning_path.learning_resource.id, list_items[0].id],
        ),
        format="json",
    )

    assert resp.status_code == (204 if is_editor else 403)
    for item in list_items[1:]:
        old_position = item.position
        item.refresh_from_db()
        assert item.position == (old_position - 1 if is_editor else old_position)


@pytest.mark.parametrize("is_editor", [True, False])
def test_learning_path_endpoint_delete(mock_opensearch, client, user, is_editor):
    """Test learningpath endpoint for deleting a LearningPath"""
    learning_path = factories.LearningPathFactory.create()

    update_editor_group(user, is_editor)
    client.force_login(user)

    resp = client.delete(
        reverse(
            "lr:v1:learningpaths_api-detail", args=[learning_path.learning_resource.id]
        )
    )
    assert resp.status_code == (204 if is_editor else 403)
    assert (
        models.LearningPath.objects.filter(id=learning_path.id).exists()
        is not is_editor
    )
    assert (
        models.LearningResource.objects.filter(
            id=learning_path.learning_resource.id
        ).exists()
        is not is_editor
    )
    assert mock_opensearch.deindex.call_count == (1 if is_editor else 0)


@pytest.mark.parametrize("is_editor", [True, False])
def test_get_resource_learning_paths(user_client, user, is_editor):
    """Test that the learning paths are returned for a resource"""
    update_editor_group(user, is_editor)
    course = factories.CourseFactory.create()
    path_items = sorted(
        factories.LearningPathRelationshipFactory.create_batch(
            3, child=course.learning_resource
        ),
        key=lambda item: item.id,
    )
    resp = user_client.get(
        reverse("lr:v1:courses_api-detail", args=[course.learning_resource.id])
    )
    expected = (
        [
            {
                "id": path_item.id,
                "parent": path_item.parent_id,
                "child": course.learning_resource.id,
            }
            for path_item in path_items
        ]
        if is_editor
        else []
    )
    response_data = sorted(
        resp.data.get("learning_path_parents"), key=lambda item: item["id"]
    )
    assert response_data == expected
