"""Tests for learning_resources UserList views"""
import pytest
from django.urls import reverse

from learning_resources.factories import (
    CourseFactory,
    LearningResourceTopicFactory,
    UserListFactory,
    UserListRelationshipFactory,
)
from learning_resources.models import UserList
from open_discussions.factories import UserFactory

# pylint:disable=redefined-outer-name, use-maxsplit-arg


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_endpoint_get(client, is_author, user):
    """Test learning path endpoint"""
    author = UserFactory.create()
    user_list = UserListFactory.create(author=author)

    another_user_list = UserListFactory.create(author=UserFactory.create())

    UserListRelationshipFactory.create(parent=user_list, position=1)
    UserListRelationshipFactory.create(parent=user_list, position=2)

    # Anonymous users should get no results
    resp = client.get(reverse("lr_userlists_api-list"))
    assert resp.status_code == 403

    # Logged in user should get own lists
    client.force_login(author if is_author else user)
    resp = client.get(reverse("lr_userlists_api-list"))
    assert resp.data.get("count") == (1 if is_author else 0)

    resp = client.get(reverse("lr_userlists_api-detail", args=[user_list.id]))
    assert resp.status_code == (404 if not is_author else 200)
    if resp.status_code == 200:
        assert resp.data.get("title") == user_list.title
        assert resp.data.get("item_count") == 2
    resp = client.get(reverse("lr_userlists_api-detail", args=[another_user_list.id]))
    assert resp.status_code == 404


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_user_list_endpoint_create(  # pylint: disable=too-many-arguments
    client, is_anonymous
):
    """Test userlist endpoint for creating a UserList"""
    user = UserFactory.create()
    if not is_anonymous:
        client.force_login(user)

    data = {"title": "My List"}

    resp = client.post(reverse("lr_userlists_api-list"), data=data, format="json")
    assert resp.status_code == (403 if is_anonymous else 201)
    if resp.status_code == 201:
        assert resp.data.get("title") == resp.data.get("title")
        assert resp.data.get("author") == user.id


@pytest.mark.parametrize("update_topics", [True, False])
def test_user_list_endpoint_patch(client, update_topics):
    """Test userlist endpoint for updating a UserList"""
    [original_topic, new_topic] = LearningResourceTopicFactory.create_batch(2)
    list_user = UserFactory.create()
    userlist = UserListFactory.create(
        author=list_user,
        title="Title 1",
        topics=[original_topic],
    )
    UserListRelationshipFactory.create(parent=userlist)

    client.force_login(list_user)

    data = {"title": "Title 2"}
    if update_topics:
        data["topics"] = [new_topic.id]

    resp = client.patch(
        reverse("lr_userlists_api-detail", args=[userlist.id]), data=data, format="json"
    )
    assert resp.data["title"] == "Title 2"
    assert resp.data["topics"][0]["id"] == (
        new_topic.id if update_topics else original_topic.id
    )


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_items_endpoint_create_item(client, user, is_author):
    """Test userlistitems endpoint for creating a UserListItem"""
    author = UserFactory.create()
    userlist = UserListFactory.create(author=author)
    course = CourseFactory.create()

    client.force_login(author if is_author else user)

    data = {"child": course.learning_resource.id}

    resp = client.post(
        reverse("lr_userlistitems_api-list", args=[userlist.id]),
        data=data,
        format="json",
    )
    assert resp.status_code == (201 if is_author else 403)
    if resp.status_code == 201:
        assert resp.json().get("child") == course.learning_resource.id


def test_user_list_items_endpoint_create_item_bad_data(client, user):
    """Test userlistitems endpoint for creating a UserListRelationship with bad data"""
    userlist = UserListFactory.create(author=user)

    client.force_login(user)

    data = {"child": 999}

    resp = client.post(
        reverse("lr_userlistitems_api-list", args=[userlist.id]),
        data=data,
        format="json",
    )
    assert resp.status_code == 400
    assert resp.json() == {
        "child": ['Invalid pk "999" - object does not exist.'],
        "error_type": "ValidationError",
    }


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_items_endpoint_update_item(client, user, is_author):
    """Test userlistitems endpoint for updating UserListRelationship positions"""
    author = UserFactory.create()
    topics = LearningResourceTopicFactory.create_batch(3)
    userlist = UserListFactory.create(author=author, topics=topics)
    list_item_1 = UserListRelationshipFactory.create(parent=userlist, position=0)
    list_item_2 = UserListRelationshipFactory.create(parent=userlist, position=1)
    list_item_3 = UserListRelationshipFactory.create(parent=userlist, position=2)

    client.force_login(author if is_author else user)

    data = {"position": 0}

    resp = client.patch(
        reverse("lr_userlistitems_api-detail", args=[userlist.id, list_item_3.id]),
        data=data,
        format="json",
    )
    assert resp.status_code == (200 if is_author else 403)
    if resp.status_code == 200:
        assert resp.json()["position"] == 0
        for idx, item in enumerate([list_item_3, list_item_1, list_item_2]):
            item.refresh_from_db()
            assert item.position == idx


def test_user_list_items_endpoint_update_items_wrong_list(client, user):
    """Verify that trying an update via userlistitems api in wrong list fails"""
    userlist = UserListFactory.create(author=user)
    list_item_incorrect = UserListRelationshipFactory.create()

    client.force_login(user)

    data = {"id": list_item_incorrect.id, "position": 44}

    resp = client.patch(
        reverse(
            "lr_userlistitems_api-detail", args=[userlist.id, list_item_incorrect.id]
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == 404


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_items_endpoint_delete_items(client, user, is_author):
    """Test userlistitems endpoint for deleting UserListItems"""
    author = UserFactory.create()
    userlist = UserListFactory.create(author=author)
    list_items = sorted(
        UserListRelationshipFactory.create_batch(2, parent=userlist),
        key=lambda item: item.id,
    )

    client.force_login(author if is_author else user)

    resp = client.delete(
        reverse("lr_userlistitems_api-detail", args=[userlist.id, list_items[0].id]),
        format="json",
    )
    assert resp.status_code == (204 if is_author else 403)
    if resp.status_code == 204:
        client.delete(
            reverse(
                "lr_userlistitems_api-detail", args=[userlist.id, list_items[0].id]
            ),
            format="json",
        )
        for item in list_items[1:]:
            old_position = item.position
            item.refresh_from_db()
            assert item.position == (old_position - 1)


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_endpoint_delete(client, user, is_author):
    """Test userlist endpoint for deleting a UserList"""
    author = UserFactory.create()
    userlist = UserListFactory.create(author=author)

    client.force_login(author if is_author else user)

    resp = client.delete(reverse("lr_userlists_api-detail", args=[userlist.id]))
    assert resp.status_code == (204 if is_author else 404)
    assert UserList.objects.filter(id=userlist.id).exists() is not is_author
