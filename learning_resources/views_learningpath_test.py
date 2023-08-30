"""Tests for course_catalog LearningPath views"""
import pytest
from django.urls import reverse

from course_catalog.factories import CourseFactory
from learning_resources import factories, models
from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
)
from learning_resources.utils import update_editor_group
from open_discussions.factories import UserFactory

# pylint:disable=redefined-outer-name,unused-argument


@pytest.mark.parametrize("is_public", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
def test_learning_path_endpoint_get(client, is_public, is_editor, user):
    """Test learning path endpoint"""
    update_editor_group(user, is_editor)

    learning_path = factories.LearningPathFactory.create(
        author=UserFactory.create(),
        is_unpublished=not is_public,
    )
    assert learning_path.learning_resource.published == is_public

    another_learning_path = factories.LearningPathFactory.create(
        author=UserFactory.create(),
        is_unpublished=not is_public,
    )
    assert another_learning_path.learning_resource.published == is_public

    for idx, child in enumerate(learning_path.learning_resource.children.all()):
        models.LearningResourceRelationship.objects.filter(id=child.id).update(
            position=idx
        )

    # Anonymous users should get public results
    resp = client.get(reverse("lr_learningpaths_api-list"))
    assert resp.data.get("count") == (2 if is_public else 0)

    # Logged in user should get public lists or all lists if editor
    client.force_login(user)
    resp = client.get(reverse("lr_learningpaths_api-list"))
    assert resp.data["count"] == (2 if is_public or is_editor else 0)

    resp = client.get(
        reverse(
            "lr_learningpaths_api-detail", args=[learning_path.learning_resource.id]
        )
    )
    assert resp.status_code == (404 if not (is_public or is_editor) else 200)
    if resp.status_code == 200:
        assert resp.data["title"] == learning_path.learning_resource.title
        assert (
            resp.data["learning_path"]["item_count"]
            == learning_path.learning_resource.children.count()
        )

    # Logged in user should see other person's public list
    resp = client.get(
        reverse(
            "lr_learningpaths_api-detail",
            args=[another_learning_path.learning_resource.id],
        )
    )
    assert resp.status_code == (404 if not is_public and not is_editor else 200)
    if resp.status_code == 200:
        assert resp.data.get("title") == another_learning_path.learning_resource.title


@pytest.mark.parametrize("is_published", [True, False])
@pytest.mark.parametrize("is_staff", [True, False])
@pytest.mark.parametrize("is_super", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
@pytest.mark.parametrize("is_anonymous", [True, False])
def test_learning_path_endpoint_create(  # pylint: disable=too-many-arguments
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
    resp = client.post(reverse("lr_learningpaths_api-list"), data=data, format="json")
    assert resp.status_code == (201 if has_permission else 403)
    if resp.status_code == 201:
        assert resp.data.get("title") == resp.data.get("title")
        assert resp.data.get("description") == resp.data.get("description")
        assert resp.data.get("learning_path").get("author") == user.id


@pytest.mark.parametrize("is_public", [True, False])
@pytest.mark.parametrize("is_editor", [True, False])
@pytest.mark.parametrize("update_topics", [True, False])
def test_learning_path_endpoint_patch(client, update_topics, is_public, is_editor):
    """Test learningpath endpoint for updating a LearningPath"""
    [original_topic, new_topic] = factories.LearningResourceTopicFactory.create_batch(2)
    user = UserFactory.create()
    update_editor_group(user, is_editor)
    learningpath = factories.LearningPathFactory.create(
        author=user,
        learning_resource=factories.LearningResourceFactory.create(
            title="Title 1",
            topics=[original_topic],
            resource_type=LearningResourceType.learning_path.value,
        ),
    )
    factories.LearningPathItemFactory.create(parent=learningpath.learning_resource)

    client.force_login(user)

    data = {
        "title": "Title 2",
        "published": is_public,
    }

    if update_topics:
        data["topics"] = [new_topic.id]

    resp = client.patch(
        reverse(
            "lr_learningpaths_api-detail", args=[learningpath.learning_resource.id]
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == (200 if is_editor else 403)
    if resp.status_code == 200:
        assert resp.data["title"] == "Title 2"
        assert resp.data["topics"][0]["id"] == (
            new_topic.id if update_topics else original_topic.id
        )


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
            "lr_learningpathitems_api-list", args=[learning_path.learning_resource.id]
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

    update_editor_group(user, True)
    client.force_login(user)

    data = {"child": 999}

    resp = client.post(
        reverse(
            "lr_learningpathitems_api-list", args=[learning_path.learning_resource.id]
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == 400
    assert resp.json() == {
        "child": ['Invalid pk "999" - object does not exist.'],
        "error_type": "ValidationError",
    }


@pytest.mark.parametrize("is_editor, position", [[True, 0], [True, 2], [False, 1]])
def test_learning_path_items_endpoint_update_item_position(
    client, user, is_editor, position
):
    """Test lr_learningpathitems_api endpoint for updating LearningResourceRelationship positions"""
    learning_path = factories.LearningPathFactory.create()
    list_item_1 = factories.LearningPathItemFactory.create(
        parent=learning_path.learning_resource, position=0
    )
    list_item_2 = factories.LearningPathItemFactory.create(
        parent=learning_path.learning_resource, position=1
    )
    list_item_3 = factories.LearningPathItemFactory.create(
        parent=learning_path.learning_resource, position=2
    )

    update_editor_group(user, is_editor)
    client.force_login(user)

    data = {"position": position}

    resp = client.patch(
        reverse(
            "lr_learningpathitems_api-detail",
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
            # mock_learning_path_index.upsert_learning_path.assert_called_once_with(
            #     learning_path.id
            # )


def test_learning_path_items_endpoint_update_items_wrong_list(client, user):
    """Verify that trying an update in wrong list fails"""
    learning_path = factories.LearningPathFactory.create()
    list_item_incorrect = factories.LearningPathItemFactory.create()

    update_editor_group(user, True)
    client.force_login(user)

    data = {"position": 44}

    resp = client.patch(
        reverse(
            "lr_learningpathitems_api-detail",
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
        factories.LearningPathItemFactory.create_batch(
            num_items, parent=learning_path.learning_resource
        ),
        key=lambda item: item.position,
    )
    assert len(list_items) == num_items

    update_editor_group(user, is_editor)
    client.force_login(user)

    resp = client.delete(
        reverse(
            "lr_learningpathitems_api-detail",
            args=[learning_path.learning_resource.id, list_items[0].id],
        ),
        format="json",
    )

    assert resp.status_code == (204 if is_editor else 403)
    for item in list_items[1:]:
        old_position = item.position
        item.refresh_from_db()
        assert item.position == (old_position - 1 if is_editor else old_position)

    # Uncomment when search is ready
    # if is_editor:
    #     assert mock_learning_path_index.delete_learning_path_view.call_count == (
    #         0 if num_items == 2 else 1
    #     )
    #     assert mock_learning_path_index.upsert_learning_path_view.call_count == (
    #         1 if num_items == 2 else 0
    #     )


@pytest.mark.parametrize("is_editor", [True, False])
def test_learning_path_endpoint_delete(client, user, is_editor):
    """Test learningpath endpoint for deleting a LearningPath"""
    learning_path = factories.LearningPathFactory.create()

    update_editor_group(user, is_editor)
    client.force_login(user)

    resp = client.delete(
        reverse(
            "lr_learningpaths_api-detail", args=[learning_path.learning_resource.id]
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
    # Uncomment when search is ready
    # assert mock_learning_path_index.delete_learning_path_view.call_count == (
    #     1 if is_editor else 0
    # )

    @pytest.mark.parametrize("is_editor", [True, False])
    def test_get_resource_learning_paths(client, user):
        """Test course detail endpoint"""
        update_editor_group(user, is_editor)
        course = CourseFactory.create()
        path_items = sorted(
            factories.LearningPathItemFactory.create_batch(3, child=course),
            key=lambda item: item.position,
        )
        resp = client.get(
            reverse("lr_courses_api-detail", args=[course.learning_resource.id])
        )

        items_json = resp.data.get("learning_path_parents")
        if is_editor:
            for idx, item in items_json:
                assert item.get("id") == path_items[idx].id
                assert item.get("position") == path_items[idx].position
                assert item.get("child") == course.learning_resource.id
        else:
            assert items_json == []
